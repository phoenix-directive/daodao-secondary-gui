import { graphql } from '@/generated/gql';
import { Chain } from '@/hooks/helpers/assets';
import { useAddress } from '@/hooks/useWallet';
import { useQuery } from '@apollo/client/react';

const GET_REFERRED_BY = graphql(`
  query ReferredBy($address: String!) {
    address(where: { address_id: $address }) {
      referred_by_code
    }
  }
`);

/**
 * Hook to check if the current user has accepted a referral code
 */
export function useHasReferral() {
    const address = useAddress(Chain.Terra);

    const { data, loading, error } = useQuery(GET_REFERRED_BY, {
        variables: { address: address || '' },
        skip: !address,
        fetchPolicy: 'network-only'
    });

    return {
        hasReferral: address ? !!data?.address?.referred_by_code : null,
        loading,
        error,
    };
}
