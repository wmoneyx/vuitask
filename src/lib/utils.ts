import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function safeFetch(url: string, options?: RequestInit) {
  try {
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
  }
}
