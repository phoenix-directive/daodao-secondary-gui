import { ProposalMembership } from '@/components/custom/proposal-membership';
import { ProposalMessage } from '@/components/custom/proposal-message';
import { VotesListAll } from '@/components/custom/proposals/votes-list-all';
import { VotingResults } from '@/components/custom/voting-results';
import { AddressLink } from '@/components/ui/address-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalStatusIcon } from '@/components/ui/proposal-status-icon';
import { Config, ProposalResponse } from '@/daodao/types/contracts/DaoProposalSingle.v2';
import { Chain } from '@/hooks/helpers/assets';
import { fromUnixNano } from '@/hooks/helpers/helpers';
import { useChain } from '@/hooks/useChain';
import { useDaoDaoState } from '@/hooks/useDaoDao';
import { usePageMeta } from '@/hooks/usePageMeta';
import { globalReload } from '@/hooks/useReload';
import { useAddress } from '@/hooks/useWallet';
import { ProposalAction, ProposalDraft } from '@/lib/proposal-drafts';
import { createVotingModuleAdapter } from '@/lib/voting-modules/adapter-factory';
import { AlertCircle, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

export function ProposalDetailPage() {
  const { address: daoAddress, proposalId } = useParams<{
    address: string;
    proposalId: string;
  }>();
  const chain = useChain(Chain.Terra);
  const navigate = useNavigate();
  const daoState = useDaoDaoState(daoAddress);
  const daoData = daoState.data.value;

  const [proposal, setProposal] = useState<ProposalResponse | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [decimals, setDecimals] = useState<number>(0);
  const address = useAddress(Chain.Terra);

  // Parse the prefix and numeric ID from the proposalId (e.g., "A-123" -> prefix="A", id=123)
  const { prefix, numericId } = useMemo(() => {
    if (!proposalId) return { prefix: null, numericId: null };
    const match = proposalId.match(/^([A-Z])(\d+)$/);
    if (match) {
      return { prefix: match[1], numericId: parseInt(match[2], 10) };
    }
    // Fallback for backwards compatibility with numeric-only IDs
    return { prefix: 'A', numericId: parseInt(proposalId, 10) };
  }, [proposalId]);

  // Find the correct proposal module based on the prefix
  const proposalModuleAddress = useMemo(() => {
    if (!daoData || !prefix) return null;
    const module = daoData.proposal_modules?.find(
      (m) => m.prefix === prefix && m.status === 'enabled',
    );
    return module?.address || null;
  }, [daoData, prefix]);

  // Set page title
  const proposalTitle = proposal?.proposal.title || `Proposal ${proposalId}`;
  usePageMeta('proposal-detail', proposalTitle);

  useEffect(() => {
    const fetchProposal = async () => {
      if (!proposalModuleAddress || numericId === null) return;

      setIsLoading(true);
      setError(null);

      try {
        const [proposalResult, configResult] = await Promise.all([
          chain.read.query<ProposalResponse>(proposalModuleAddress, {
            proposal: {
              proposal_id: numericId,
            },
          }),
          chain.read.queryCached<Config>(proposalModuleAddress, { config: {} }, 60 * 24),
        ]);

        setProposal(proposalResult);

        // Fetch voting module decimals if we have the DAO data
        if (daoData?.voting_module) {
          try {
            const adapter = await createVotingModuleAdapter(daoData.voting_module, chain);
            if (adapter) {
              const decimals = await adapter.fetchDecimals();
              setDecimals(decimals);
            }
          } catch (err) {
            console.error('Failed to fetch voting module decimals:', err);
            // Non-critical error, continue with default decimals
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch proposal:', err);
        setError(err.message || 'Failed to load proposal');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposal();
  }, [proposalModuleAddress, numericId, chain, globalReload.value, daoData]);

  const getExpirationDate = (expiration: any) => {
    if (!expiration) return 'Unknown';
    if ('at_time' in expiration) {
      try {
        const date = fromUnixNano(+expiration.at_time);
        return date.toLocaleString();
      } catch {
        return 'Invalid date';
      }
    }
    if ('at_height' in expiration) {
      return `Block ${expiration.at_height}`;
    }
    if ('never' in expiration) {
      return 'Never';
    }
    return 'Unknown';
  };

  const handleDuplicate = () => {
    if (!proposal || !daoAddress) return;

    // Convert proposal messages to actions format
    const actions: ProposalAction[] = proposal.proposal.msgs.map((msg) => ({
      id: crypto.randomUUID(),
      data: msg,
    }));

    const duplicateData: ProposalDraft = {
      title: proposal.proposal.title,
      description: proposal.proposal.description,
      proposalType: 'single',
      actions,
      choices: [],
      lastModified: Date.now(),
    };

    const encodedData = encodeURIComponent(JSON.stringify(duplicateData));
    navigate(`/dao/${daoAddress}/proposals/create?data=${encodedData}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading proposal...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="mb-2 text-lg font-semibold">Error Loading Proposal</h3>
              <p className="text-sm text-muted-foreground">{error || 'Proposal not found'}</p>
              <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { status } = proposal.proposal;

  const hasDescription =
    proposal.proposal.description && proposal.proposal.description.trim() !== '.';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col  justify-between gap-2">
                <div className="flex justify-between">
                  <span className="text-sm font-mono text-muted-foreground">
                    {prefix}-{proposal.id.toString().padStart(5, '0')}
                  </span>
                  <ProposalStatusIcon
                    status={status}
                    showLabel={true}
                    className="text-sm font-semibold shrink-0"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-3xl wrap-break-word">
                    {proposal.proposal.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            {hasDescription && (
              <CardContent>
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {proposal.proposal.description}
                  </ReactMarkdown>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Details Sidebar - Mobile Only (shown after header) */}
          <div className="lg:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Proposer</div>
                  <AddressLink address={proposal.proposal.proposer} />
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Expiration</div>
                  <div className="text-sm">{getExpirationDate(proposal.proposal.expiration)}</div>
                </div>

                <div>
                  <a
                    href={`https://daodao.zone/dao/${daoAddress}/proposals/${prefix}${proposal.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on DAO DAO
                  </a>
                </div>

                <div>
                  <Button variant="outline" size="sm" onClick={handleDuplicate} className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Membership Card - Mobile */}
            {address && proposal && proposalModuleAddress && daoData && (
              <div className="mt-6">
                <ProposalMembership
                  proposal={proposal}
                  proposalModuleAddress={proposalModuleAddress}
                  votingModuleAddress={daoData.voting_module}
                  config={config}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          {proposal.proposal.msgs && proposal.proposal.msgs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Actions</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setExpandedMessages(new Set(proposal.proposal.msgs.map((_, i) => i)))
                    }
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedMessages(new Set())}
                  >
                    Collapse All
                  </Button>
                </div>
              </div>
              {proposal.proposal.msgs.map((msg, index) => (
                <ProposalMessage
                  key={index}
                  message={msg}
                  expanded={expandedMessages.has(index)}
                  onToggleExpanded={(isExpanded) => {
                    const newExpanded = new Set(expandedMessages);
                    if (isExpanded) {
                      newExpanded.add(index);
                    } else {
                      newExpanded.delete(index);
                    }
                    setExpandedMessages(newExpanded);
                  }}
                />
              ))}
            </div>
          )}

          {/* Voting Results */}
          <VotingResults
            votes={proposal.proposal.votes}
            totalPower={proposal.proposal.total_power}
            threshold={proposal.proposal.threshold}
          />

          {/* Votes List */}
          {proposalModuleAddress && numericId !== null && (
            <VotesListAll
              proposalModuleAddress={proposalModuleAddress}
              proposalId={numericId}
              totalPower={proposal.proposal.total_power}
              decimals={decimals}
            />
          )}
        </div>

        {/* Right Sidebar - Desktop Only */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Proposer</div>
                <AddressLink address={proposal.proposal.proposer} />
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Expiration</div>
                <div className="text-sm">{getExpirationDate(proposal.proposal.expiration)}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">DAODAO</div>
                <a
                  href={`https://daodao.zone/dao/${daoAddress}/proposals/${prefix}${proposal.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on DAO DAO
                </a>
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={handleDuplicate} className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Proposal
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Membership Card */}
          {address && proposal && proposalModuleAddress && daoData && (
            <div className="mt-6">
              <ProposalMembership
                proposal={proposal}
                proposalModuleAddress={proposalModuleAddress}
                votingModuleAddress={daoData.voting_module}
                config={config}
                onVoteSuccess={() => {
                  // Refetch proposal data after vote
                  if (proposalModuleAddress && numericId !== null) {
                    chain.read
                      .query<ProposalResponse>(proposalModuleAddress, {
                        proposal: {
                          proposal_id: numericId,
                        },
                      })
                      .then(setProposal);
                  }
                }}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
