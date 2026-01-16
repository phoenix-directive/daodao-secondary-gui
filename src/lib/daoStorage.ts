export interface DaoItem {
  address: string
  name: string
  image?: string
  lastVisited?: number
}

const RECENT_DAOS_KEY = 'daodao_recent_daos'
const FAVORITE_DAOS_KEY = 'daodao_favorite_daos'
const MAX_RECENT_DAOS = 10

export const daoStorage = {
  // Recent DAOs
  getRecentDaos(): DaoItem[] {
    try {
      const stored = localStorage.getItem(RECENT_DAOS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  addRecentDao(dao: DaoItem): void {
    try {
      const recent = this.getRecentDaos()
      const filtered = recent.filter(d => d.address !== dao.address)
      const updated = [
        { ...dao, lastVisited: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT_DAOS)
      localStorage.setItem(RECENT_DAOS_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save recent DAO:', error)
    }
  },

  clearRecentDaos(): void {
    localStorage.removeItem(RECENT_DAOS_KEY)
  },

  // Favorite DAOs
  getFavoriteDaos(): DaoItem[] {
    try {
      const stored = localStorage.getItem(FAVORITE_DAOS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  addFavoriteDao(dao: DaoItem): void {
    try {
      const favorites = this.getFavoriteDaos()
      if (!favorites.some(d => d.address === dao.address)) {
        const updated = [...favorites, dao]
        localStorage.setItem(FAVORITE_DAOS_KEY, JSON.stringify(updated))
      }
    } catch (error) {
      console.error('Failed to save favorite DAO:', error)
    }
  },

  removeFavoriteDao(address: string): void {
    try {
      const favorites = this.getFavoriteDaos()
      const updated = favorites.filter(d => d.address !== address)
      localStorage.setItem(FAVORITE_DAOS_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to remove favorite DAO:', error)
    }
  },

  isFavorite(address: string): boolean {
    return this.getFavoriteDaos().some(d => d.address === address)
  },

  toggleFavorite(dao: DaoItem): boolean {
    if (this.isFavorite(dao.address)) {
      this.removeFavoriteDao(dao.address)
      return false
    } else {
      this.addFavoriteDao(dao)
      return true
    }
  },
}
