import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { Database, SnippetItem } from "./types.js";

const DATA_FILE = join(homedir(), ".termvault", "db.json");

function ensureDbFile(): void {
  const parent = dirname(DATA_FILE);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }

  if (!existsSync(DATA_FILE)) {
    const initial: Database = { version: 1, snippets: [] };
    writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

export function readDb(): Database {
  ensureDbFile();
  const raw = readFileSync(DATA_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw) as Database;
    if (!parsed.snippets || !Array.isArray(parsed.snippets)) {
      throw new Error("Invalid database format");
    }
    return parsed;
  } catch {
    const repaired: Database = { version: 1, snippets: [] };
    writeFileSync(DATA_FILE, JSON.stringify(repaired, null, 2), "utf8");
    return repaired;
  }
}

export function writeDb(db: Database): void {
  ensureDbFile();
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

export function listGroups(): string[] {
  const db = readDb();
  const set = new Set(db.snippets.map((s) => s.group));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function addSnippet(input: Omit<SnippetItem, "id" | "createdAt" | "updatedAt">): SnippetItem {
  const db = readDb();
  const now = new Date().toISOString();
  const item: SnippetItem = {
    id: randomUUID(),
    name: input.name.trim(),
    group: input.group.trim(),
    content: input.content,
    type: input.type,
    createdAt: now,
    updatedAt: now,
  };
  db.snippets.push(item);
  writeDb(db);
  return item;
}

export function getSnippet(query: { idOrName: string; group?: string }): SnippetItem | undefined {
  const db = readDb();
  const needle = query.idOrName.trim();

  const exactId = db.snippets.find((s) => s.id === needle && (!query.group || s.group === query.group));
  if (exactId) {
    return exactId;
  }

  const exactName = db.snippets.find(
    (s) => s.name.toLowerCase() === needle.toLowerCase() && (!query.group || s.group === query.group),
  );

  return exactName;
}

export function removeSnippet(query: { idOrName: string; group?: string }): boolean {
  const db = readDb();
  const target = getSnippet(query);
  if (!target) {
    return false;
  }

  const index = db.snippets.findIndex((s) => s.id === target.id);
  if (index < 0) {
    return false;
  }

  db.snippets.splice(index, 1);
  writeDb(db);
  return true;
}

export function listSnippets(group?: string): SnippetItem[] {
  const db = readDb();
  return db.snippets
    .filter((s) => (!group ? true : s.group === group))
    .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
}

export function dbFilePath(): string {
  return DATA_FILE;
}
