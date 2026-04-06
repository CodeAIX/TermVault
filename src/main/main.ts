import { join } from "node:path";
import { app, BrowserWindow, clipboard, ipcMain } from "electron";
import { addSnippet, getSnippetById, listSnippets, recordUsage, removeSnippet, renameGroup, searchSnippets, toggleFavorite, updateSnippet } from "./store";
import type { SnippetInput } from "../shared/types";

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 900,
    minHeight: 640,
    title: "TermVault",
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (DEV_SERVER_URL) {
    window.loadURL(DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    window.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function registerIpc(): void {
  ipcMain.handle("termvault:list", async () => {
    return listSnippets();
  });

  ipcMain.handle("termvault:add", async (_event, input: SnippetInput) => {
    if (!input || !input.name || !input.group || !input.content) {
      throw new Error("name/group/content are required");
    }

    const type = input.type === "snippet" ? "snippet" : "command";
    return addSnippet({ ...input, type });
  });

  ipcMain.handle("termvault:remove", async (_event, id: string) => {
    if (!id || typeof id !== "string") {
      return false;
    }
    return removeSnippet(id);
  });

  ipcMain.handle("termvault:copy", async (_event, content: string) => {
    if (typeof content !== "string") {
      return false;
    }
    clipboard.writeText(content);
    return true;
  });

  ipcMain.handle("termvault:update", async (_event, id: string, input: SnippetInput) => {
    if (!id || typeof id !== "string" || !input || !input.name || !input.group || !input.content) {
      return null;
    }

    const type = input.type === "snippet" ? "snippet" : "command";
    return updateSnippet(id, { ...input, type });
  });

  ipcMain.handle("termvault:rename-group", async (_event, oldGroup: string, newGroup: string) => {
    if (typeof oldGroup !== "string" || typeof newGroup !== "string") {
      return false;
    }
    return renameGroup(oldGroup, newGroup);
  });

  ipcMain.handle("termvault:search", async (_event, query: string) => {
    if (typeof query !== "string") {
      return [];
    }
    return searchSnippets(query);
  });

  ipcMain.handle("termvault:toggle-favorite", async (_event, id: string) => {
    if (typeof id !== "string") {
      return false;
    }
    return toggleFavorite(id);
  });

  ipcMain.handle("termvault:record-usage", async (_event, id: string) => {
    if (typeof id !== "string") {
      return false;
    }
    return recordUsage(id);
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
