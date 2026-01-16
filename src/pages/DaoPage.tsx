import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { daoStorage } from "@/lib/daoStorage";
import { ProposalsTab } from "@/components/dao/ProposalsTab";
import { TreasuryTab } from "@/components/dao/TreasuryTab";
import { MembersTab } from "@/components/dao/MembersTab";
import { AppsTab } from "@/components/dao/AppsTab";

export function DaoPage() {
  const { address } = useParams<{ address: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);

  // Placeholder DAO data - would be fetched from chain
  const daoData = {
    name: "Example DAO",
    description:
      "This is a placeholder description for the DAO. In production, this would be fetched from the blockchain using the DAO address. The DAO provides decentralized governance for its community.",
    image: undefined, // Would be an image URL
  };

  useEffect(() => {
    if (address) {
      // Add to recent DAOs
      daoStorage.addRecentDao({
        address,
        name: daoData.name,
      });
    }
  }, [address, daoData.name]);

  useEffect(() => {
    if (address) {
      // Check if favorited
      setIsFavorite(daoStorage.isFavorite(address));
    }
  }, [address]);

  const handleToggleFavorite = () => {
    if (address) {
      const newState = daoStorage.toggleFavorite({
        address,
        name: daoData.name,
      });
      setIsFavorite(newState);
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* DAO Header */}
        <Card className="mb-8 border-2">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row">
              {/* Avatar */}
              <div className="shrink-0">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-3xl font-bold text-white shadow-lg md:h-32 md:w-32 md:text-4xl">
                  {daoData.name.substring(0, 2).toUpperCase()}
                </div>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                      {daoData.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                        {address}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleCopyAddress}
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={isFavorite ? "default" : "outline"}
                      size="sm"
                      onClick={handleToggleFavorite}
                      className="gap-2"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          isFavorite ? "fill-current" : ""
                        }`}
                      />
                      {isFavorite ? "Favorited" : "Favorite"}
                    </Button>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {daoData.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="proposals" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="apps">Apps</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="proposals" className="mt-0">
              <ProposalsTab />
            </TabsContent>

            <TabsContent value="treasury" className="mt-0">
              <TreasuryTab daoAddress={address} daoName={daoData.name} />
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              <MembersTab />
            </TabsContent>

            <TabsContent value="apps" className="mt-0">
              <AppsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
