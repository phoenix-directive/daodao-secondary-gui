import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { daoStorage, type DaoItem } from "@/lib/daoStorage";

export function LandingPage() {
  const navigate = useNavigate();
  const [searchAddress, setSearchAddress] = useState("");
  const [recentDaos, setRecentDaos] = useState<DaoItem[]>([]);
  const [favoriteDaos, setFavoriteDaos] = useState<DaoItem[]>([]);

  useEffect(() => {
    setRecentDaos(daoStorage.getRecentDaos());
    setFavoriteDaos(daoStorage.getFavoriteDaos());
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      navigate(`/dao/${searchAddress.trim()}`);
    }
  };

  const DaoCard = ({ dao }: { dao: DaoItem }) => {
    const isFavorite = daoStorage.isFavorite(dao.address);

    const handleToggleFavorite = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      daoStorage.toggleFavorite(dao);
      setFavoriteDaos(daoStorage.getFavoriteDaos());
    };

    return (
      <a href={`/dao/${dao.address}`}>
        <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
                  {dao.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base group-hover:text-primary transition-colors">
                    {dao.name}
                  </CardTitle>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {dao.address}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={handleToggleFavorite}
              >
                <Star
                  className={`h-4 w-4 ${
                    isFavorite
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </a>
    );
  };

  return (
    <div className="bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Explore DAOs
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            View your recent and favorite DAOs, or search for a DAO by address
          </p>
        </div>

        {/* Search Section */}
        <div className="mx-auto mb-16 max-w-3xl">
          <Card className="border-2">
            <CardContent className="p-6">
              <form onSubmit={handleSearch}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      placeholder="Enter DAO address..."
                      className="h-12 pl-10 text-base"
                    />
                  </div>
                  <Button type="submit" size="lg" className="px-8">
                    <span className="mr-2">Go</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recent & Favorites Grid */}
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Recently Viewed DAOs */}
          <div>
            <div className="mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h2 className="text-2xl font-bold">Recently Viewed</h2>
              {recentDaos.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {recentDaos.length}
                </Badge>
              )}
            </div>
            {recentDaos.length > 0 ? (
              <div className="grid gap-4">
                {recentDaos.map((dao) => (
                  <DaoCard key={dao.address} dao={dao} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex min-h-50 flex-col items-center justify-center p-8 text-center">
                  <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    No recent DAOs yet. Search for a DAO above to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Favorite DAOs */}
          <div>
            <div className="mb-6 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-2xl font-bold">Favorites</h2>
              {favoriteDaos.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {favoriteDaos.length}
                </Badge>
              )}
            </div>
            {favoriteDaos.length > 0 ? (
              <div className="grid gap-4">
                {favoriteDaos.map((dao) => (
                  <DaoCard key={dao.address} dao={dao} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex min-h-50 flex-col items-center justify-center p-8 text-center">
                  <Star className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    No favorite DAOs yet. Click the star icon on any DAO to add
                    it to your favorites.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
