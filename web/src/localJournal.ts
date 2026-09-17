export const JOURNAL_KEY = "summit.teach.v1";
export const JOURNAL_META_KEY = "summit.teach.sync.v1";
export const JOURNAL_RECOVERY_KEY = "summit.teach.recovery.v1";

export interface JournalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LocalJournal<T> {
  journal: T;
  /** Original text, including malformed JSON, retained without repair or truncation. */
  recovery: string[];
  localStorageFailed: boolean;
  canOverwriteLocal: boolean;
}

function readRecovery(raw: string | null): string[] {
  if (raw === null) return [];
  try {
    const value = JSON.parse(raw);
    if (
      value?.version === 1 &&
      Array.isArray(value.entries) &&
      value.entries.every((entry: unknown) => typeof entry === "string")
    )
      return [...new Set<string>(value.entries)];
  } catch {
    /* Preserve even an unreadable recovery archive verbatim. */
  }
  return [raw];
}

/** Only the known v0.5.0 omission is migrated; all other input still faces strict validation. */
export function migrateLocalJournal(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const candidate = value as Record<string, unknown>;
    if (
      candidate.version === 1 &&
      !Object.prototype.hasOwnProperty.call(candidate, "planConfirmed")
    ) {
      return {
        ...candidate,
        planConfirmed:
          typeof candidate.prediction === "string" &&
          candidate.prediction.trim() !== "",
      };
    }
  }
  return value;
}

export function readLocalJournal<T>(
  storage: JournalStorage,
  parse: (value: unknown) => T | null,
  empty: () => T,
): LocalJournal<T> {
  let raw: string | null = null;
  let recovery: string[] = [];
  let primaryReadFailed = false;
  let recoveryReadFailed = false;
  try {
    raw = storage.getItem(JOURNAL_KEY);
  } catch {
    // A denied read may hide an existing journal. Do not replace an unknown value later.
    primaryReadFailed = true;
  }
  try {
    recovery = readRecovery(storage.getItem(JOURNAL_RECOVERY_KEY));
  } catch {
    recoveryReadFailed = true;
  }
  if (primaryReadFailed)
    return {
      journal: empty(),
      recovery,
      localStorageFailed: true,
      canOverwriteLocal: false,
    };
  if (raw === null)
    return {
      journal: empty(),
      recovery,
      localStorageFailed: recoveryReadFailed,
      canOverwriteLocal: !recoveryReadFailed,
    };
  try {
    const journal = parse(migrateLocalJournal(JSON.parse(raw)));
    if (journal)
      return {
        journal,
        recovery,
        localStorageFailed: recoveryReadFailed,
        canOverwriteLocal: !recoveryReadFailed,
      };
  } catch {
    /* Rejected source text must survive before any replacement is cached. */
  }
  if (recoveryReadFailed)
    return {
      journal: empty(),
      recovery: [raw],
      localStorageFailed: true,
      canOverwriteLocal: false,
    };
  if (recovery.includes(raw))
    return {
      journal: empty(),
      recovery,
      localStorageFailed: false,
      canOverwriteLocal: true,
    };
  recovery = [...recovery, raw];
  try {
    storage.setItem(
      JOURNAL_RECOVERY_KEY,
      JSON.stringify({ version: 1, entries: recovery }),
    );
    return {
      journal: empty(),
      recovery,
      localStorageFailed: false,
      canOverwriteLocal: true,
    };
  } catch {
    // Quota failures are common when copying a large journal. Keep both the original
    // local key and the in-memory copy available for a recovery download.
    return {
      journal: empty(),
      recovery,
      localStorageFailed: true,
      canOverwriteLocal: false,
    };
  }
}

export function cacheLocalJournal(
  storage: JournalStorage,
  journal: unknown,
  metadata: { revision: number | null; dirty: boolean },
  canOverwriteLocal: boolean,
): boolean {
  if (!canOverwriteLocal) return false;
  try {
    // Mark dirty first so a partial write cannot disguise an offline change as synced.
    storage.setItem(
      JOURNAL_META_KEY,
      JSON.stringify({ ...metadata, dirty: true }),
    );
    storage.setItem(JOURNAL_KEY, JSON.stringify(journal));
    if (!metadata.dirty)
      storage.setItem(JOURNAL_META_KEY, JSON.stringify(metadata));
    return true;
  } catch {
    return false;
  }
}

export function recoveryDownload(recovery: readonly string[]) {
  if (recovery.length === 0) return null;
  return recovery.length === 1
    ? {
        filename: "summit-journal-recovery.txt",
        type: "text/plain;charset=utf-8",
        text: recovery[0],
      }
    : {
        filename: "summit-journal-recovery.json",
        type: "application/json",
        text: JSON.stringify({ version: 1, entries: recovery }, null, 2),
      };
}
