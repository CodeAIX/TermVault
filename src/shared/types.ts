export type SnippetType = "command" | "snippet";

export interface SnippetItem {
  id: string;
  name: string;
  group: string;
  content: string;
  type: SnippetType;
  createdAt: string;
  updatedAt: string;
}

export interface SnippetInput {
  name: string;
  group: string;
  content: string;
  type: SnippetType;
}

export interface TermVaultApi {
  listSnippets: () => Promise<SnippetItem[]>;
  addSnippet: (input: SnippetInput) => Promise<SnippetItem>;
  updateSnippet: (id: string, input: SnippetInput) => Promise<SnippetItem | null>;
  removeSnippet: (id: string) => Promise<boolean>;
  renameGroup: (oldGroup: string, newGroup: string) => Promise<boolean>;
  searchSnippets: (query: string) => Promise<SnippetItem[]>;
  copySnippetContent: (content: string) => Promise<boolean>;
}
