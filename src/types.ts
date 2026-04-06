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

export interface Database {
  version: number;
  snippets: SnippetItem[];
}
