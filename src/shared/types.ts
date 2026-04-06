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
  removeSnippet: (id: string) => Promise<boolean>;
  copySnippetContent: (content: string) => Promise<boolean>;
}
