import { featureFlags } from '@/config/feature-flags';
import { useShuttle } from '@/delphi-labs/shuttle-react';
import { Chain } from '@/hooks/helpers/assets';
import { useHasReferral } from '@/hooks/useHasReferral';
import { checkAndStorePendingReferralCode } from '@/hooks/useReferral';
import { useAddress } from '@/hooks/useWallet';
import { LoadingDisplayEmpty } from '@/pages/components/loading-display';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ReferralGateProps {
  children: React.ReactNode;
}

/**
 * ReferralGate component that enforces referral code requirement
 *
 * Behavior:
 * - If feature flag is disabled, renders children directly
 * - If no wallet connected, redirects to gate page
 * - If wallet connected but no referral, redirects to gate page
 * - If wallet has referral, renders children
 *
 * To disable: Set featureFlags.enableReferralGate to false in config/feature-flags.ts
 */
export function ReferralGate({ children }: ReferralGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const address = useAddress(Chain.Terra);
  const { wallets } = useShuttle();
  const { hasReferral, loading } = useHasReferral();

  useEffect(() => {
    // If feature flag is disabled, don't do anything
    if (!featureFlags.enableReferralGate) {
      return;
    }

    // If we're on the gate page and user has a referral, redirect to original page
    if (location.pathname === '/referral-gate') {
      if (!loading && hasReferral === true) {
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get('navigate') || '/markets';
        console.log('User has referral - redirecting to', returnTo);
        navigate(returnTo, { replace: true });
      }
      return;
    }

    // If no wallet is connected, redirect to gate
    if (!address || wallets.length === 0) {
      console.log('No wallet connected - redirecting to gate');
      checkAndStorePendingReferralCode();
      navigate(`/referral-gate?navigate=${encodeURIComponent(location.pathname)}`, {
        replace: true,
      });
      return;
    }

    // If we've finished loading and user doesn't have a referral, redirect to gate
    if (!loading && hasReferral === false) {
      console.log('User does not have a referral - redirecting to gate');
      checkAndStorePendingReferralCode();
      navigate(`/referral-gate?navigate=${encodeURIComponent(location.pathname)}`, {
        replace: true,
      });
      return;
    }
  }, [address, wallets.length, hasReferral, loading, navigate, location.pathname]);

  // If feature flag is disabled, render children directly
  if (!featureFlags.enableReferralGate) {
    return <>{children}</>;
  }

  // Always show children on the gate page
  if (location.pathname === '/referral-gate') {
    return <>{children}</>;
  }

  // Show loading state while checking referral status
  if (loading && address && wallets.length > 0) {
    return (
      <LoadingDisplayEmpty
        title="Verifying access..."
        description="Please wait while we check your credentials"
      />
    );
  }

  // If no wallet is connected, don't render anything (redirect will happen)
  if (!address || wallets.length === 0) {
    return null;
  }

  // If user doesn't have a referral, don't render anything (redirect will happen)
  if (hasReferral === false) {
    return null;
  }

  // User has a referral, render protected content
  return <>{children}</>;
}

