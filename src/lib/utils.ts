import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const requestLocks = new Set<string>();
const activeRequests = new Map<string, Promise<any>>();

export async function safeFetch(url: string, options?: RequestInit) {
  const method = options?.method || 'GET';
  const lockKey = `${method}:${url}`;

  if (method !== 'GET' && !url.includes('sync-profile')) {
    // If it's a POST/PUT/DELETE, check if there's already an active request
    if (activeRequests.has(lockKey) || requestLocks.has(lockKey)) {
        return { error: 'Thao tác quá nhanh, vui lòng từ từ!' };
    }
  }

  try {
    // Fail-safe: if url somehow contains the old netlify domain, strip it out
    if (url.includes('vuitask.netlify.app')) {
       url = url.replace(/https?:\/\/vuitask\.netlify\.app/g, '');
    }

    const fetchPromise = fetch(url, options);
    if (method !== 'GET' && !url.includes('sync-profile')) {
       activeRequests.set(lockKey, fetchPromise);
    }

    const res = await fetchPromise;
    
    if (method !== 'GET' && !url.includes('sync-profile')) {
       activeRequests.delete(lockKey);
       // Optional cooldown after request finishes
       requestLocks.add(lockKey);
       setTimeout(() => requestLocks.delete(lockKey), 500);
    }

    if (!res.ok) {
        if (res.status === 404) {
            console.warn(`API Not Found: ${url}`);
        }
        return null;
    }
    if (res.status === 204) return { success: true };

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const text = await res.text();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error(`Malformed JSON from ${url}:`, text.slice(0, 100));
            return null;
        }
    }
    return null; 
  } catch (err) {
    if (method !== 'GET' && !url.includes('sync-profile')) {
       activeRequests.delete(lockKey);
    }
    return null;
  }
}
