import { createClient } from 'redis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

class InMemoryCache {
    constructor() {
        this.store = new Map();
    }

    async get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }

    async set(key, value, options = {}) {
        let expiry = null;
        if (options && options.EX) {
            expiry = Date.now() + options.EX * 1000;
        }
        this.store.set(key, { value: String(value), expiry });
        return 'OK';
    }

    async del(key) {
        return this.store.delete(key) ? 1 : 0;
    }
}

const memoryCache = new InMemoryCache();
let activeClient = null;
let isConnected = false;
let hasLoggedFailure = false;

if (process.env.REDIS_URL) {
    try {
        const client = createClient({
            url: process.env.REDIS_URL,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries >= 3) {
                        if (!hasLoggedFailure) {
                            hasLoggedFailure = true;
                            console.warn('[Redis] Connection attempts exhausted. Falling back to in-memory caching.');
                        }
                        return false; // Stop infinite reconnect loop
                    }
                    return Math.min(retries * 500, 2000);
                }
            }
        });

        client.on('error', (err) => {
            if (!hasLoggedFailure) {
                console.warn(`[Redis] Connection warning: ${err.message || err}. Using in-memory fallback.`);
                hasLoggedFailure = true;
            }
        });

        client.on('connect', () => {
            isConnected = true;
            console.log('[Redis] Connected successfully.');
        });

        client.on('end', () => {
            isConnected = false;
        });

        // Attempt initial connection without blocking the process indefinitely
        client.connect()
            .then(() => {
                activeClient = client;
                isConnected = true;
            })
            .catch((err) => {
                if (!hasLoggedFailure) {
                    hasLoggedFailure = true;
                    console.warn(`[Redis] Could not connect to remote instance (${err.code || err.message}). In-memory cache enabled.`);
                }
            });
    } catch (err) {
        console.warn('[Redis] Client initialization error, using in-memory cache:', err.message);
    }
} else {
    console.log('[Redis] No REDIS_URL provided. Running with in-memory cache.');
}

// Resilient wrapper providing get, set, del
const redisClient = {
    async get(key) {
        if (activeClient && isConnected) {
            try {
                return await activeClient.get(key);
            } catch (err) {
                console.warn('[Redis] get error, reading from in-memory fallback:', err.message);
                return await memoryCache.get(key);
            }
        }
        return await memoryCache.get(key);
    },

    async set(key, value, options) {
        if (activeClient && isConnected) {
            try {
                return await activeClient.set(key, value, options);
            } catch (err) {
                console.warn('[Redis] set error, storing in in-memory fallback:', err.message);
                return await memoryCache.set(key, value, options);
            }
        }
        return await memoryCache.set(key, value, options);
    },

    async del(key) {
        if (activeClient && isConnected) {
            try {
                return await activeClient.del(key);
            } catch (err) {
                console.warn('[Redis] del error, deleting from in-memory fallback:', err.message);
                return await memoryCache.del(key);
            }
        }
        return await memoryCache.del(key);
    }
};

export { redisClient };
