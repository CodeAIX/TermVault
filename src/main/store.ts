import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import type { SnippetInput, SnippetItem } from "../shared/types";

interface DbShape {
  version: number;
  snippets: SnippetItem[];
}

function dbPath(): string {
  return join(app.getPath("userData"), "termvault-db.json");
}

function ensureDb(): void {
  const file = dbPath();
  const parent = app.getPath("userData");

  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }

  if (!existsSync(file)) {
    const initial: DbShape = { version: 1, snippets: [] };
    writeFileSync(file, JSON.stringify(initial, null, 2), "utf8");
  }
}

function readDb(): DbShape {
  ensureDb();
  const file = dbPath();
  const raw = readFileSync(file, "utf8");

  try {
    const parsed = JSON.parse(raw) as DbShape;
    if (!Array.isArray(parsed.snippets)) {
      throw new Error("Invalid db file");
    }
    return parsed;
  } catch {
    const repaired: DbShape = { version: 1, snippets: [] };
    writeFileSync(file, JSON.stringify(repaired, null, 2), "utf8");
    return repaired;
  }
}

function writeDb(db: DbShape): void {
  ensureDb();
  writeFileSync(dbPath(), JSON.stringify(db, null, 2), "utf8");
}

export function listSnippets(): SnippetItem[] {
  const db = readDb();
  return db.snippets.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
}

export function addSnippet(input: SnippetInput): SnippetItem {
  const db = readDb();
  const now = new Date().toISOString();

  const item: SnippetItem = {
    id: randomUUID(),
    name: input.name.trim(),
    group: input.group.trim(),
    content: input.content,
    type: input.type,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };

  db.snippets.push(item);
  writeDb(db);
  return item;
}

export function removeSnippet(id: string): boolean {
  const db = readDb();
  const index = db.snippets.findIndex((s) => s.id === id);
  if (index < 0) {
    return false;
  }

  db.snippets.splice(index, 1);
  writeDb(db);
  return true;
}

export function getSnippetById(id: string): SnippetItem | undefined {
  const db = readDb();
  return db.snippets.find((s) => s.id === id);
}

export function updateSnippet(id: string, input: SnippetInput): SnippetItem | undefined {
  const db = readDb();
  const item = db.snippets.find((s) => s.id === id);
  if (!item) {
    return undefined;
  }

  item.name = input.name.trim();
  item.group = input.group.trim();
  item.content = input.content;
  item.type = input.type;
  item.updatedAt = new Date().toISOString();

  writeDb(db);
  return item;
}

export function renameGroup(oldGroup: string, newGroup: string): boolean {
  const db = readDb();
  const trimmedOld = oldGroup.trim();
  const trimmedNew = newGroup.trim();

  if (trimmedOld === trimmedNew) {
    return false;
  }

  let found = false;
  for (const item of db.snippets) {
    if (item.group === trimmedOld) {
      item.group = trimmedNew;
      found = true;
    }
  }

  if (found) {
    writeDb(db);
  }

  return found;
}

export function searchSnippets(query: string): SnippetItem[] {
  const db = readDb();
  const normalized = query.toLowerCase().trim();

  if (!normalized) {
    return listSnippets();
  }

  const keywords = normalized.split(/\s+/).filter((k) => k.length > 0);

  return db.snippets
    .filter((item) => {
      const searchText = `${item.name} ${item.group} ${item.content}`.toLowerCase();
      return keywords.every((kw) => searchText.includes(kw));
    })
    .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
}

export function toggleFavorite(id: string): boolean {
  const db = readDb();
  const item = db.snippets.find((s) => s.id === id);
  if (!item) {
    return false;
  }

  item.isFavorite = !item.isFavorite;
  writeDb(db);
  return true;
}

export function recordUsage(id: string): boolean {
  const db = readDb();
  const item = db.snippets.find((s) => s.id === id);
  if (!item) {
    return false;
  }

  item.lastUsed = new Date().toISOString();
  writeDb(db);
  return true;
}
