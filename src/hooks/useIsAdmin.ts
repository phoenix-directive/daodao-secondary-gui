import { globalConfig } from '@/config/config';
import { Chain } from '@/hooks/helpers/assets';
import { useAddress } from './useWallet';

export const useIsAdmin = () => {
  const address = useAddress(Chain.Terra);
  return globalConfig.adminAddresses.includes(address);
};
