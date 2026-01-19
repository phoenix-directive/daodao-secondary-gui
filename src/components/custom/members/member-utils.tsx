/**
 * Shared UI components for member lists
 * Pure utilities moved to @/lib/member-helpers for Fast Refresh
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Users } from 'lucide-react';
import { ReactNode } from 'react';

// Re-export utilities and types from lib
export type { MemberWithPercentage } from '@/lib/member-helpers';

/**
 * Shared error state UI
 */
export function MemberListError({ title, error }: { title: string; error: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="mb-2 text-lg font-semibold text-destructive">Error Loading Members</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Shared loading state UI
 */
export function MemberListLoading({ title, message }: { title: string; message?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">{message || 'Loading members...'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Shared empty state UI
 */
export function MemberListEmpty({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No Members</h3>
          <p className="text-sm text-muted-foreground">No members found in this DAO.</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Shared unsupported module UI
 */
export function MemberListUnsupported({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="mb-2 text-lg font-semibold">Unsupported Voting Module</h3>
          <p className="text-sm text-muted-foreground">
            This DAO's voting module type is not yet supported for member display.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Wrapper card for member content
 */
export function MemberListCard({
  title,
  memberCount,
  children,
}: {
  title: string;
  memberCount?: number;
  children: ReactNode;
}) {
  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>
          {title}
          {memberCount !== undefined && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({memberCount} {memberCount === 1 ? 'member' : 'members'})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

