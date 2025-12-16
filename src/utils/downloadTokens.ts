import { downloadApi } from '../api';

type TokenCache = Record<
  string,
  {
    token: string;
    expiresAt: string;
  }
>;

const STORAGE_KEY = 'downloadTokens';
const EXPIRY_BUFFER_MS = 30 * 1000; // refresh token slightly before actual expiry

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const readCache = (): TokenCache => {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenCache) : {};
  } catch {
    return {};
  }
};

const writeCache = (cache: TokenCache) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(cache));
};

const isStillValid = (entry?: { token: string; expiresAt: string }) => {
  if (!entry?.expiresAt) return false;
  return new Date(entry.expiresAt).getTime() - EXPIRY_BUFFER_MS > Date.now();
};

type EnsureOptions = {
  forceRefresh?: boolean;
};

export const ensureDownloadToken = async (ebookId: string, options: EnsureOptions = {}) => {
  const cache = readCache();
  const cached = cache[ebookId];
  if (!options.forceRefresh && isStillValid(cached)) {
    return cached!.token;
  }

  const fresh = await downloadApi.requestToken(ebookId);
  if (!options.forceRefresh) {
    cache[ebookId] = fresh;
    writeCache(cache);
  }
  return fresh.token;
};

export const invalidateDownloadToken = (ebookId: string) => {
  const cache = readCache();
  if (!cache[ebookId]) return;
  delete cache[ebookId];
  writeCache(cache);
};

export const clearDownloadTokens = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEY);
};
