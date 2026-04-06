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

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function pickBool(source: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return undefined;
}

function normalizeImportedOne(value: unknown, index: number): SnippetItem | null {
  const now = new Date().toISOString();

  if (typeof value === "string") {
    const content = value.trim();
    if (!content) {
      return null;
    }
    const firstLine = content.split("\n")[0]?.trim() || `Imported ${index + 1}`;
    const inferredType = content.includes("\n") ? "snippet" : "command";
    return {
      id: randomUUID(),
      name: firstLine.slice(0, 60),
      group: "imported",
      content,
      type: inferredType,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const content = pickString(row, ["content", "command", "snippet", "code", "text", "value"]);
  if (!content) {
    return null;
  }

  const name = pickString(row, ["name", "title", "label", "description"]) || content.split("\n")[0]?.trim() || `Imported ${index + 1}`;
  const group = pickString(row, ["group", "category", "folder", "tag"]) || "imported";
  const rawType = pickString(row, ["type", "kind"]);
  const type = rawType === "snippet" || rawType === "command" ? rawType : (content.includes("\n") ? "snippet" : "command");
  const id = pickString(row, ["id", "uuid"]) || randomUUID();
  const createdAt = pickString(row, ["createdAt", "created", "created_at"]) || now;
  const updatedAt = pickString(row, ["updatedAt", "updated", "updated_at"]) || now;
  const lastUsed = pickString(row, ["lastUsed", "last_used", "usedAt", "used_at"]);
  const isFavorite = pickBool(row, ["isFavorite", "favorite", "starred"]) || false;

  const normalized: SnippetItem = {
    id,
    name: name.slice(0, 120),
    group: group.slice(0, 80),
    content,
    type,
    isFavorite,
    createdAt,
    updatedAt,
  };

  if (lastUsed) {
    normalized.lastUsed = lastUsed;
  }

  return normalized;
}

export function normalizeImportedItems(payload: unknown): SnippetItem[] {
  let rows: unknown[] = [];

  if (Array.isArray(payload)) {
    rows = payload;
  } else if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.snippets)) {
      rows = obj.snippets;
    } else if (Array.isArray(obj.items)) {
      rows = obj.items;
    } else if (Array.isArray(obj.data)) {
      rows = obj.data;
    } else {
      rows = Object.values(obj);
    }
  }

  return rows
    .map((row, index) => normalizeImportedOne(row, index))
    .filter((item): item is SnippetItem => Boolean(item));
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

export function exportSnippets(): SnippetItem[] {
  const db = readDb();
  return db.snippets;
}

export function importSnippets(items: SnippetItem[], mode: "replace" | "merge" = "merge"): boolean {
  if (!Array.isArray(items)) {
    return false;
  }

  const db = readDb();

  if (mode === "replace") {
    db.snippets = items.map((item) => ({
      ...item,
      id: item.id || randomUUID(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      isFavorite: Boolean(item.isFavorite),
    }));
  } else {
    const existingIds = new Set(db.snippets.map((s) => s.id));
    const existingSignatures = new Set(db.snippets.map((s) => `${s.group}\n${s.name}\n${s.content}`));
    for (const item of items) {
      const signature = `${item.group}\n${item.name}\n${item.content}`;
      if (!existingIds.has(item.id) && !existingSignatures.has(signature)) {
        db.snippets.push({
          ...item,
          id: item.id || randomUUID(),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
          isFavorite: Boolean(item.isFavorite),
        });
        existingSignatures.add(signature);
      }
    }
  }

  writeDb(db);
  return true;
}
