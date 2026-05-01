import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const pendingRequests = new Set<string>();

export async function safeFetch(url: string, options?: RequestInit) {
  const method = options?.method || 'GET';
  const requestKey = `${method}:${url}`;

  // Anti-spam: prevent identical concurrent requests
  if (method !== 'GET' && pendingRequests.has(requestKey)) {
    console.warn(`[Anti-Spam] Duplicate request blocked: ${requestKey}`);
    return null;
  }

  if (method !== 'GET') {
    pendingRequests.add(requestKey);
  }

  try {
    // Fail-safe: if url somehow contains the old netlify domain, strip it out
    if (url.includes('vuitask.netlify.app')) {
       url = url.replace(/https?:\/\/vuitask\.netlify\.app/g, '');
    }

    const res = await fetch(url, options);
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
    // Avoid spamming logs for standard network errors if possible
    return null;
  } finally {
    if (method !== 'GET') {
      pendingRequests.delete(requestKey);
    }
  }
}
