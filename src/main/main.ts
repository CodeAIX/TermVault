import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { app, BrowserWindow, clipboard, dialog, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import { addSnippet, exportSnippets, getSnippetById, importSnippets, listSnippets, recordUsage, removeSnippet, renameGroup, searchSnippets, toggleFavorite, updateSnippet } from "./store";
import type { SnippetInput, SnippetItem } from "../shared/types";

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// Configure auto-updater
autoUpdater.checkForUpdatesAndNotify();

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

  ipcMain.handle("termvault:export", async (_event) => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) {
      throw new Error("No active window");
    }

    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Export Snippets",
      defaultPath: `TermVault_${new Date().toISOString().split("T")[0]}.json`,
      filters: [{ name: "JSON Files", extensions: ["json"] }],
    });

    if (result.canceled || !result.filePath) {
      return false;
    }

    const snippets = exportSnippets();
    const data = JSON.stringify(snippets, null, 2);
    writeFileSync(result.filePath, data, "utf8");
    return true;
  });

  ipcMain.handle("termvault:import", async (_event, mode: "replace" | "merge" = "merge") => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) {
      throw new Error("No active window");
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Import Snippets",
      filters: [{ name: "JSON Files", extensions: ["json"] }],
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return false;
    }

    try {
      const filePath = result.filePaths[0]!;
      const data = readFileSync(filePath, "utf8");
      const snippets = JSON.parse(data) as SnippetItem[];

      if (!Array.isArray(snippets)) {
        throw new Error("Invalid file format: expected array of snippets");
      }

      return importSnippets(snippets, mode);
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  // Check for updates after app is ready
  if (!DEV_SERVER_URL) {
    autoUpdater.checkForUpdatesAndNotify();
  }

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
