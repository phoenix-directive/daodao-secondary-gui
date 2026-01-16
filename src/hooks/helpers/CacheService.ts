interface CacheEntry {
  created: number;
  ttl_minutes: number;
}

export class CacheService {
  promises: Record<string, Promise<any> | undefined> = {};
  promisesMemoryCache: Record<
    string,
    { promise: Promise<any>; aliveUntil: number } | undefined
  > = {};

  constructor() {
    this.cleanupCached();
  }

  private cleanupCached() {
    for (const key in localStorage) {
      if (key.endsWith("_created")) {
        const time = localStorage.getItem(key);
        if (time) {
          const timeValue = JSON.parse(time) as CacheEntry;
          if (
            timeValue.created <
            Date.now() - timeValue.ttl_minutes * 60 * 1000
          ) {
            localStorage.removeItem(key);
            const cacheKey = key.substring(0, key.length - "_created".length);
            console.log("CLEANING CACHE", cacheKey);
            localStorage.removeItem(cacheKey);
          }
        }
      }
    }
  }

  async getMemoryCached<T>(
    key: string,
    liveTimeS: number,
    func: () => Promise<T>,
    ignoreError = false
  ): Promise<T> {
    if (liveTimeS === 0) {
      return func();
    }

    const existing = this.promisesMemoryCache[key];
    if ((existing?.aliveUntil ?? 0) > Date.now()) {
      return existing!.promise;
    } else {
      const promise = func();
      if (ignoreError) {
        promise.catch((a) => {
          this.promisesMemoryCache[key] = undefined;
          throw a;
        });
      }

      const aliveUntil = Date.now() + liveTimeS * 1000;

      this.promisesMemoryCache[key] = {
        promise,
        aliveUntil,
      };

      setTimeout(() => delete this.promisesMemoryCache[key], liveTimeS * 1000);

      return promise;
    }
  }

  clearCached(key: string) {
    key = "_" + key;
    const timekey = key + "_created";

    localStorage.removeItem(key);
    localStorage.removeItem(timekey);
    this.promises[key] = undefined;
  }

  getCachedRaw<T>(key: string, liveTimeMin: number) {
    key = "_" + key;
    const timekey = key + "_created";
    const time = localStorage.getItem(timekey);

    if (time) {
      const timeValue = JSON.parse(time) as CacheEntry;

      if (timeValue.created < Date.now() - liveTimeMin * 60 * 1000) {
        localStorage.removeItem(key);
        localStorage.removeItem(timekey);
      } else {
        const value = localStorage.getItem(key)!;
        return JSON.parse(value) as T;
      }
    }

    return undefined;
  }

  setCachedRaw(key: string, result: any, liveTimeMin: number) {
    key = "_" + key;
    const timekey = key + "_created";

    localStorage.setItem(
      timekey,
      JSON.stringify(<CacheEntry>{
        created: Date.now(),
        ttl_minutes: liveTimeMin,
      })
    );
    localStorage.setItem(key, JSON.stringify(result));
  }

  async getCached<T>(
    key: string,
    liveTimeMin: number,
    func: () => Promise<T>,
    ignoreError = false
  ): Promise<T> {
    if (liveTimeMin === 0) {
      return func();
    }

    key = "_" + key;
    const timekey = key + "_created";
    const time = localStorage.getItem(timekey);

    if (time) {
      const timeValue = JSON.parse(time) as CacheEntry;

      if (timeValue.created < Date.now() - liveTimeMin * 60 * 1000) {
        localStorage.removeItem(key);
        localStorage.removeItem(timekey);
      } else {
        const value = localStorage.getItem(key)!;
        return JSON.parse(value) as T;
      }
    }

    if (this.promises[key]) {
      return this.promises[key];
    }

    const promise = func();
    this.promises[key] = promise;

    if (ignoreError) {
      promise.catch((a) => {
        this.promises[key] = undefined;
        throw a;
      });
    }

    const result = await promise;
    if (result) {
      localStorage.setItem(
        timekey,
        JSON.stringify(<CacheEntry>{
          created: Date.now(),
          ttl_minutes: liveTimeMin,
        })
      );
      localStorage.setItem(key, JSON.stringify(result));
      this.promises[key] = undefined;
    }

    return result;
  }
}
