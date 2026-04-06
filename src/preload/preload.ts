import { contextBridge, ipcRenderer } from "electron";
import type { SnippetInput, SnippetItem, TermVaultApi } from "../shared/types";

const api: TermVaultApi = {
  listSnippets: async () => ipcRenderer.invoke("termvault:list") as Promise<SnippetItem[]>,
  addSnippet: async (input: SnippetInput) => ipcRenderer.invoke("termvault:add", input) as Promise<SnippetItem>,
  updateSnippet: async (id: string, input: SnippetInput) => ipcRenderer.invoke("termvault:update", id, input) as Promise<SnippetItem | null>,
  removeSnippet: async (id: string) => ipcRenderer.invoke("termvault:remove", id) as Promise<boolean>,
  renameGroup: async (oldGroup: string, newGroup: string) => ipcRenderer.invoke("termvault:rename-group", oldGroup, newGroup) as Promise<boolean>,
  searchSnippets: async (query: string) => ipcRenderer.invoke("termvault:search", query) as Promise<SnippetItem[]>,
  toggleFavorite: async (id: string) => ipcRenderer.invoke("termvault:toggle-favorite", id) as Promise<boolean>,
  recordUsage: async (id: string) => ipcRenderer.invoke("termvault:record-usage", id) as Promise<boolean>,
  copySnippetContent: async (content: string) => ipcRenderer.invoke("termvault:copy", content) as Promise<boolean>,
};

contextBridge.exposeInMainWorld("termvault", api);
