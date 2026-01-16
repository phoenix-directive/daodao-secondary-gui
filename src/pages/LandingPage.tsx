import { AddressLink } from '@/components/ui/address-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DaoAvatar } from '@/components/ui/dao-avatar';
import { Input } from '@/components/ui/input';
import {
  favoriteDaos,
  isFavorite,
  recentDaos,
  toggleFavorite,
  type DaoItem,
} from '@/lib/signals-instances';
import { ArrowRight, Clock, Search, Star } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();
  const [searchAddress, setSearchAddress] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      navigate(`/dao/${searchAddress.trim()}`);
    }
  };

  const DaoCard = ({ dao }: { dao: DaoItem }) => {
    const isCurrentlyFavorite = isFavorite(dao.address);

    const handleToggleFavorite = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(dao);
    };

    return (
      <Link to={`/dao/${dao.address}`}>
        <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/20 overflow-hidden">
          <CardHeader className="gap-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <DaoAvatar
                  name={dao.name}
                  imageUrl={dao.imageUrl}
                  size="small"
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base  transition-colors truncate">
                    {dao.name}
                  </CardTitle>
                  <div className="mt-1 min-w-0">
                    <AddressLink
                      address={dao.address}
                      className="text-xs text-muted-foreground hover:text-muted-foreground/80"
                      short={true}
                    />
                  </div>
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
                    isCurrentlyFavorite
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </Link>
    );
  };

  return (
    <div className="bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-[#B32712] via-[#E24A17] to-[#FF8A1E] bg-clip-text text-transparent">
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
              {recentDaos.value.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {recentDaos.value.length}
                </Badge>
              )}
            </div>
            {recentDaos.value.length > 0 ? (
              <div className="grid gap-4">
                {recentDaos.value.map((dao) => (
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
              {favoriteDaos.value.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {favoriteDaos.value.length}
                </Badge>
              )}
            </div>
            {favoriteDaos.value.length > 0 ? (
              <div className="grid gap-4">
                {favoriteDaos.value.map((dao) => (
                  <DaoCard key={dao.address} dao={dao} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex min-h-50 flex-col items-center justify-center p-8 text-center">
                  <Star className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    No favorite DAOs yet. Click the star icon on any DAO to add it to your
                    favorites.
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
