import { Chain } from '@/hooks/helpers/assets';
import { useAsyncSignal } from '@/hooks/useAsyncSignal';
import { useChain } from '@/hooks/useChain';
import { globalReload } from '@/hooks/useReload';
import { DaoDaoDumpState } from './useDaoDao';

export interface SubDao {
  addr: string;
  charter?: string | null;
}

export interface SubDaoWithState extends SubDao {
  name: string;
  description: string;
  imageUrl: string | null;
}

/**
 * Query DAO for its sub-DAOs and fetch their state in parallel
 */
export const useSubDaos = (daoAddress: string | undefined) => {
  const chain = useChain(Chain.Terra);

  return useAsyncSignal(async () => {
    if (!daoAddress) return [];

    // Query list of sub-DAOs
    const cacheTimeMin = 24 * 60; // 24 hours
    const subDaos = await chain.read.queryCached<SubDao[]>(
      daoAddress,
      {
        list_sub_daos: {},
      },
      cacheTimeMin,
    );

    if (!subDaos || subDaos.length === 0) {
      return [];
    }

    // Fetch dump_state for each sub-DAO in parallel
    const subDaosWithState = await Promise.all(
      subDaos.map(async (subDao) => {
        try {
          const state = await chain.read.dao.dumpState<DaoDaoDumpState>(subDao.addr);

          return {
            ...subDao,
            name: state.config.name,
            description: state.config.description,
            imageUrl: state.config.image_url,
          } as SubDaoWithState;
        } catch (error) {
          console.error(`Failed to fetch state for sub-DAO ${subDao.addr}:`, error);
          // Return with fallback values if query fails
          return {
            ...subDao,
            name: 'Unknown DAO',
            description: '',
            imageUrl: null,
          } as SubDaoWithState;
        }
      }),
    );

    return subDaosWithState;
  }, [daoAddress, globalReload.value]);
};
