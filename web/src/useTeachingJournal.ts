import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMPTY_JOURNAL,
  parseTeachingJournal,
  type Journal,
} from "../../shared/journal";
import {
  cacheLocalJournal,
  JOURNAL_META_KEY,
  readLocalJournal,
  recoveryDownload,
} from "./localJournal";

// Access through methods so blocked browser storage is caught by the recovery layer.
const browserStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
};
type Snapshot = { revision: number; journal: Journal | null };
type Status = "loading" | "saving" | "saved" | "offline" | "conflict";
function parseSnapshot(value: unknown): Snapshot {
  const v = value as Snapshot;
  if (!v || !Number.isSafeInteger(v.revision) || v.revision < 0)
    throw Error("Invalid saved revision");
  const journal = v.journal === null ? null : parseTeachingJournal(v.journal);
  if (v.journal !== null && !journal) throw Error("Invalid saved journal");
  return { revision: v.revision, journal };
}
/** Local play remains usable offline; server writes are serialized and revision checked. */
export function useTeachingJournal() {
  const [local] = useState(() =>
    readLocalJournal(browserStorage, parseTeachingJournal, () => ({
      ...EMPTY_JOURNAL,
    })),
  );
  const [book, setBook] = useState<Journal>(() => local.journal);
  const [localStorageFailed, setLocalStorageFailed] = useState(
    local.localStorageFailed,
  );
  const [syncStatus, setStatus] = useState<Status>("loading");
  const [retry, setRetry] = useState(0);
  const current = useRef(book),
    revision = useRef<number | null>(null),
    saved = useRef("");
  const running = useRef(false),
    mounted = useRef(true),
    blocked = useRef(false);
  const conflict = useRef<Snapshot | null>(null);
  const pump = useRef<() => void>(() => {});
  current.current = book;
  function cache(journal: Journal, dirty: boolean) {
    const success = cacheLocalJournal(
      browserStorage,
      journal,
      { revision: revision.current, dirty },
      local.canOverwriteLocal,
    );
    if (mounted.current) setLocalStorageFailed(!success);
    return success;
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/teaching/journal", {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(5000),
          ]),
        });
        if (!response.ok) throw Error();
        const snapshot = parseSnapshot(await response.json());
        if (!alive) return;
        let meta: { dirty?: boolean; revision?: number } | null = null;
        try {
          meta = JSON.parse(localStorage.getItem(JOURNAL_META_KEY) || "null");
        } catch {
          /* older local journal */
        }
        const local = current.current;
        const hasLocal = local.runs.length > 0 || !!local.route;
        const differs =
          JSON.stringify(snapshot.journal) !== JSON.stringify(local);
        if (snapshot.journal && hasLocal && differs && (meta?.dirty || !meta)) {
          conflict.current = snapshot;
          blocked.current = true;
          setStatus("conflict");
          return;
        }
        revision.current = snapshot.revision;
        blocked.current = false;
        conflict.current = null;
        if (snapshot.journal) {
          saved.current = JSON.stringify(snapshot.journal);
          current.current = snapshot.journal;
          setBook(snapshot.journal);
          cache(snapshot.journal, false);
          setStatus("saved");
        } else {
          saved.current = "";
          setStatus("saving");
          pump.current();
        }
      } catch {
        if (alive) {
          blocked.current = true;
          setStatus("offline");
        }
      }
    }
    void load();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [retry]);

  pump.current = () => {
    if (
      running.current ||
      blocked.current ||
      revision.current === null ||
      !mounted.current
    )
      return;
    const sent = current.current,
      encoded = JSON.stringify(sent);
    if (encoded === saved.current) {
      setStatus("saved");
      return;
    }
    running.current = true;
    setStatus("saving");
    void (async () => {
      try {
        const response = await fetch("/api/teaching/journal", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: revision.current, journal: sent }),
          signal: AbortSignal.timeout(7000),
        });
        if (response.status === 409) {
          const snapshot = parseSnapshot(await response.json());
          conflict.current = snapshot;
          blocked.current = true;
          if (mounted.current) setStatus("conflict");
          return;
        }
        if (!response.ok) throw Error();
        const snapshot = parseSnapshot(await response.json());
        if (!snapshot.journal) throw Error();
        revision.current = snapshot.revision;
        saved.current = JSON.stringify(snapshot.journal);
        if (JSON.stringify(current.current) === encoded) {
          current.current = snapshot.journal;
          if (mounted.current) setBook(snapshot.journal);
        }
        cache(
          current.current,
          JSON.stringify(current.current) !== saved.current,
        );
        if (mounted.current) setStatus("saved");
      } catch {
        blocked.current = true;
        if (mounted.current) setStatus("offline");
      } finally {
        running.current = false;
        if (
          !blocked.current &&
          mounted.current &&
          JSON.stringify(current.current) !== saved.current
        )
          pump.current();
      }
    })();
  };
  useEffect(() => {
    // Do not overwrite metadata before the initial fetch decides whether an offline edit conflicts.
    if (syncStatus === "loading") return;
    cache(book, JSON.stringify(book) !== saved.current);
    const timer = setTimeout(() => pump.current(), 250);
    return () => clearTimeout(timer);
  }, [book, syncStatus]);
  const retrySync = useCallback(() => {
    if (revision.current !== null && !conflict.current) {
      blocked.current = false;
      pump.current();
    } else setRetry((n) => n + 1);
  }, []);
  const loadServerCopy = useCallback(() => {
    const next = conflict.current;
    if (!next?.journal) return;
    revision.current = next.revision;
    saved.current = JSON.stringify(next.journal);
    current.current = next.journal;
    setBook(next.journal);
    cache(next.journal, false);
    conflict.current = null;
    blocked.current = false;
    setStatus("saved");
  }, []);
  const downloadRecovery = useCallback(() => {
    const artifact = recoveryDownload(local.recovery);
    if (!artifact) return;
    const url = URL.createObjectURL(
      new Blob([artifact.text], { type: artifact.type }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = artifact.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [local]);
  return {
    book,
    setBook,
    syncStatus,
    retrySync,
    loadServerCopy,
    recoveryAvailable: local.recovery.length > 0,
    downloadRecovery,
    localStorageFailed,
  };
}
