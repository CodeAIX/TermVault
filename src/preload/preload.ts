import { contextBridge, ipcRenderer } from "electron";
import type { SnippetInput, SnippetItem, TermVaultApi } from "../shared/types";

const api: TermVaultApi = {
  listSnippets: async () => ipcRenderer.invoke("termvault:list") as Promise<SnippetItem[]>,
  addSnippet: async (input: SnippetInput) => ipcRenderer.invoke("termvault:add", input) as Promise<SnippetItem>,
  removeSnippet: async (id: string) => ipcRenderer.invoke("termvault:remove", id) as Promise<boolean>,
  copySnippetContent: async (content: string) => ipcRenderer.invoke("termvault:copy", content) as Promise<boolean>,
};

contextBridge.exposeInMainWorld("termvault", api);
