import { useDaoDaoState } from '@/hooks/useDaoDao';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  // Parse path manually since useParams doesn't work outside Routes
  // Match patterns: /dao/:address or /dao/:address/:tab or /dao/:address/proposals/:proposalId or /dao/:address/proposals/create
  const daoMatch = path.match(
    /^\/dao\/([^/]+)(?:\/proposals\/([A-Z]\d+)|\/proposals\/(create)|\/([^/]+))?/,
  );

  const address = daoMatch?.[1];
  const proposalId = daoMatch?.[2]; // from /dao/:address/proposals/:proposalId (e.g., "A-123")
  const createPath = daoMatch?.[3]; // from /dao/:address/proposals/create
  const tab = daoMatch?.[4]; // from /dao/:address/:tab

  const daoState = useDaoDaoState(address);
  const daoName = daoState.data.value?.config.name || address || 'DAO';

  const items: BreadcrumbItem[] = [];

  // Home/Landing
  if (path === '/') {
    // items.push({ label: 'Home' });
  } else {
    // items.push({ label: 'Home', href: '/' });

    // DAO pages - check if path starts with /dao/
    if (path.startsWith('/dao/') && address) {
      const isProposalDetail = !!proposalId;
      const isProposalCreate = !!createPath;

      // Add DAO breadcrumb (always linkable if we're deeper than the DAO page)
      if (isProposalDetail || isProposalCreate) {
        items.push({
          label: daoName,
          href: `/dao/${address}`,
        });

        if (isProposalCreate) {
          // Add proposals breadcrumb when on create page
          items.push({
            label: 'Proposals',
            href: `/dao/${address}/proposals`,
          });
          // Add create breadcrumb
          items.push({
            label: 'Create',
          });
        } else {
          // Add proposal detail breadcrumb
          // Format the proposal ID nicely (e.g., "A-123" -> "A-00123")
          items.push({
            label: `Proposal ${proposalId}`,
          });
        }
      } else if (tab) {
        items.push({
          label: daoName,
          href: `/dao/${address}`,
        });
        // Add tab breadcrumb
        const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
        items.push({
          label: tabLabel,
        });
      } else {
        // We're on the main DAO page (defaults to proposals tab)
        items.push({
          label: daoName,
        });
      }
    }
  }

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {<ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
