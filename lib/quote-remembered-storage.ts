import {
  CONTACT_STORAGE_KEY,
  CONTACT_STORAGE_KEYS,
  OBSOLETE_CONTACT_STORAGE_KEYS,
  emptyRememberedDetails,
  parseSavedDetails,
  serializeRememberedDetails,
  type RememberedDetails,
} from "@/lib/quote-remembered-details";

function readStorageValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readRememberedDetails(
  functionalAllowed: boolean,
): RememberedDetails {
  if (!functionalAllowed || typeof window === "undefined") {
    return emptyRememberedDetails();
  }

  for (const key of CONTACT_STORAGE_KEYS) {
    const details = parseSavedDetails(readStorageValue(key), key);
    if (details) return details;
  }

  return emptyRememberedDetails();
}

export function saveRememberedDetails(
  details: RememberedDetails,
  functionalAllowed: boolean,
): boolean {
  if (!functionalAllowed || typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(
      CONTACT_STORAGE_KEY,
      serializeRememberedDetails(details),
    );
  } catch {
    return false;
  }

  let obsoleteKeysRemoved = true;
  for (const key of OBSOLETE_CONTACT_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      obsoleteKeysRemoved = false;
    }
  }

  return obsoleteKeysRemoved;
}

export function deleteRememberedDetails(): boolean {
  if (typeof window === "undefined") return false;

  let deleted = true;
  for (const key of CONTACT_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      deleted = false;
    }
  }

  return deleted;
}
