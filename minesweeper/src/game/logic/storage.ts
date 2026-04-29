/**
 * Abstract storage interface for persisting game data.
 *
 * Implementations handle the actual storage backend
 * (localStorage, IndexedDB, etc.).
 */
export interface IStorage {
  /** Get a value by key, or null if not found. */
  get<T>(key: string): T | null;
  /** Set a value by key. */
  set<T>(key: string, value: T): void;
  /** Check if a key exists. */
  has(key: string): boolean;
  /** Remove a key. */
  remove(key: string): void;
  /** Clear all stored data. */
  clear(): void;
}

/**
 * In-memory storage implementation for testing.
 */
export class MemoryStorage implements IStorage {
  private data = new Map<string, string>();

  get<T>(key: string): T | null {
    const raw = this.data.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    this.data.set(key, JSON.stringify(value));
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  remove(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

/**
 * localStorage-backed storage implementation.
 *
 * All values are JSON-serialized. Read failures return null
 * instead of throwing (NFR15 graceful degradation).
 */
export class LocalStorageAdapter implements IStorage {
  constructor(private readonly prefix = 'mswp_') {}

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // Quota exceeded or other error — silently fail
    }
  }

  has(key: string): boolean {
    try {
      return localStorage.getItem(this.prefix + key) !== null;
    } catch {
      return false;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      // Silently fail
    }
  }

  clear(): void {
    try {
      // Only clear keys with our prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      // Silently fail
    }
  }
}
