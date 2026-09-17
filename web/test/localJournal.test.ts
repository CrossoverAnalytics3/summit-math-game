import test from "node:test";
import assert from "node:assert/strict";
import {
  cacheLocalJournal,
  JOURNAL_KEY,
  JOURNAL_META_KEY,
  JOURNAL_RECOVERY_KEY,
  migrateLocalJournal,
  readLocalJournal,
  recoveryDownload,
  type JournalStorage,
} from "../src/localJournal.ts";

type MiniJournal = { version: 1; prediction: string; planConfirmed: boolean };
const empty = (): MiniJournal => ({
  version: 1,
  prediction: "",
  planConfirmed: false,
});
const parse = (value: unknown): MiniJournal | null => {
  const v = value as MiniJournal;
  return v?.version === 1 &&
    typeof v.prediction === "string" &&
    typeof v.planConfirmed === "boolean"
    ? v
    : null;
};
class MemoryStorage implements JournalStorage {
  values = new Map<string, string>();
  writes: string[] = [];
  failRead = new Set<string>();
  failWrite = new Set<string>();
  getItem(key: string) {
    if (this.failRead.has(key)) throw Error("Storage denied");
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrite.has(key)) throw Error("Quota exceeded");
    this.writes.push(key);
    this.values.set(key, value);
  }
}

test("legacy prediction migrates the missing confirmation without mutating the source", () => {
  const storage = new MemoryStorage();
  const raw = JSON.stringify({ version: 1, prediction: "4" });
  storage.values.set(JOURNAL_KEY, raw);
  const local = readLocalJournal(storage, parse, empty);
  assert.equal(local.journal.planConfirmed, true);
  assert.equal(local.journal.prediction, "4");
  assert.equal(storage.values.get(JOURNAL_KEY), raw);
  assert.deepEqual(local.recovery, []);
});

test("legacy empty prediction remains unconfirmed and explicit false is never promoted", () => {
  assert.deepEqual(
    migrateLocalJournal({ version: 1, prediction: "" }),
    empty(),
  );
  const existing = { version: 1, prediction: "4", planConfirmed: false };
  assert.equal(migrateLocalJournal(existing), existing);
  assert.deepEqual(migrateLocalJournal({ version: 2, prediction: "4" }), {
    version: 2,
    prediction: "4",
  });
});

test("malformed source text is archived verbatim before any journal replacement", () => {
  const storage = new MemoryStorage();
  const original = '{"runs": [\nthis is broken but recoverable';
  storage.values.set(JOURNAL_KEY, original);
  const local = readLocalJournal(storage, parse, empty);
  assert.deepEqual(local.recovery, [original]);
  assert.deepEqual(storage.writes, [JOURNAL_RECOVERY_KEY]);
  assert.equal(storage.values.get(JOURNAL_KEY), original);
  assert.equal(
    cacheLocalJournal(
      storage,
      empty(),
      { revision: 0, dirty: false },
      local.canOverwriteLocal,
    ),
    true,
  );
  assert.deepEqual(
    JSON.parse(storage.values.get(JOURNAL_RECOVERY_KEY)!).entries,
    [original],
  );
  assert.equal(recoveryDownload(local.recovery)?.text, original);
});

test("valid JSON rejected by the parser is also retained without pretending it loaded", () => {
  const storage = new MemoryStorage();
  const original = '{"version": 500, "prediction": "4"}';
  storage.values.set(JOURNAL_KEY, original);
  const local = readLocalJournal(storage, parse, empty);
  assert.deepEqual(local.journal, empty());
  assert.deepEqual(local.recovery, [original]);
});

test("reload preserves a recovery archive and does not append the same rejected source twice", () => {
  const storage = new MemoryStorage();
  storage.values.set(JOURNAL_KEY, "bad source");
  readLocalJournal(storage, parse, empty);
  const twice = readLocalJournal(storage, parse, empty);
  assert.deepEqual(twice.recovery, ["bad source"]);
  assert.equal(storage.writes.length, 1);
  cacheLocalJournal(storage, empty(), { revision: 1, dirty: false }, true);
  assert.deepEqual(readLocalJournal(storage, parse, empty).recovery, [
    "bad source",
  ]);
});

test("another rejected source is added without clearing an earlier recovery", () => {
  const storage = new MemoryStorage();
  storage.values.set(
    JOURNAL_RECOVERY_KEY,
    JSON.stringify({ version: 1, entries: ["first broken source"] }),
  );
  storage.values.set(JOURNAL_KEY, "second broken source");
  const local = readLocalJournal(storage, parse, empty);
  assert.deepEqual(local.recovery, [
    "first broken source",
    "second broken source",
  ]);
  assert.deepEqual(
    JSON.parse(recoveryDownload(local.recovery)!.text).entries,
    local.recovery,
  );
});

test("even a malformed existing recovery archive is retained instead of discarded", () => {
  const storage = new MemoryStorage();
  storage.values.set(JOURNAL_RECOVERY_KEY, "a damaged recovery archive");
  storage.values.set(JOURNAL_KEY, "a newly damaged journal");
  assert.deepEqual(readLocalJournal(storage, parse, empty).recovery, [
    "a damaged recovery archive",
    "a newly damaged journal",
  ]);
});

test("failed recovery writes block primary replacement but keep an export in memory", () => {
  const storage = new MemoryStorage();
  storage.values.set(JOURNAL_KEY, "original rejected source");
  storage.failWrite.add(JOURNAL_RECOVERY_KEY);
  const local = readLocalJournal(storage, parse, empty);
  assert.equal(local.localStorageFailed, true);
  assert.equal(local.canOverwriteLocal, false);
  assert.equal(
    cacheLocalJournal(
      storage,
      empty(),
      { revision: 2, dirty: false },
      local.canOverwriteLocal,
    ),
    false,
  );
  assert.equal(storage.values.get(JOURNAL_KEY), "original rejected source");
  assert.equal(
    recoveryDownload(local.recovery)!.text,
    "original rejected source",
  );
});

test("a denied primary read does not claim offline safety or overwrite unknown data", () => {
  const storage = new MemoryStorage();
  storage.values.set(JOURNAL_KEY, "unknown prior data");
  storage.failRead.add(JOURNAL_KEY);
  const local = readLocalJournal(storage, parse, empty);
  assert.equal(local.localStorageFailed, true);
  assert.equal(local.canOverwriteLocal, false);
  cacheLocalJournal(
    storage,
    empty(),
    { revision: 1, dirty: true },
    local.canOverwriteLocal,
  );
  assert.equal(storage.values.get(JOURNAL_KEY), "unknown prior data");
});

test("an unreadable recovery key does not erase a readable valid primary journal", () => {
  const storage = new MemoryStorage();
  storage.values.set(
    JOURNAL_KEY,
    JSON.stringify({ ...empty(), prediction: "4", planConfirmed: true }),
  );
  storage.failRead.add(JOURNAL_RECOVERY_KEY);
  const local = readLocalJournal(storage, parse, empty);
  assert.equal(local.journal.prediction, "4");
  assert.equal(local.localStorageFailed, true);
  assert.equal(local.canOverwriteLocal, false);
});

test("a cache write failure is reported and cannot label stale metadata clean", () => {
  const storage = new MemoryStorage();
  storage.values.set(JOURNAL_KEY, "old primary");
  storage.values.set(
    JOURNAL_META_KEY,
    JSON.stringify({ revision: 1, dirty: false }),
  );
  storage.failWrite.add(JOURNAL_KEY);
  assert.equal(
    cacheLocalJournal(storage, empty(), { revision: 1, dirty: false }, true),
    false,
  );
  assert.equal(storage.values.get(JOURNAL_KEY), "old primary");
  assert.equal(JSON.parse(storage.values.get(JOURNAL_META_KEY)!).dirty, true);
});

test("successful cache writes record the requested clean revision and leave recovery untouched", () => {
  const storage = new MemoryStorage();
  storage.values.set(JOURNAL_RECOVERY_KEY, "prior recovery");
  assert.equal(
    cacheLocalJournal(storage, empty(), { revision: 7, dirty: false }, true),
    true,
  );
  assert.deepEqual(JSON.parse(storage.values.get(JOURNAL_META_KEY)!), {
    revision: 7,
    dirty: false,
  });
  assert.equal(storage.values.get(JOURNAL_RECOVERY_KEY), "prior recovery");
  assert.equal(recoveryDownload([]), null);
});
