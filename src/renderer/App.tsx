import { useEffect, useMemo, useState } from "react";
import type { SnippetInput, SnippetItem, SnippetType } from "../shared/types";

declare global {
  interface Window {
    termvault: {
      listSnippets: () => Promise<SnippetItem[]>;
      addSnippet: (input: SnippetInput) => Promise<SnippetItem>;
      removeSnippet: (id: string) => Promise<boolean>;
      copySnippetContent: (content: string) => Promise<boolean>;
    };
  }
}

interface FormState {
  name: string;
  group: string;
  content: string;
  type: SnippetType;
}

const initialForm: FormState = {
  name: "",
  group: "",
  content: "",
  type: "command",
};

export function App() {
  const [items, setItems] = useState<SnippetItem[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [groupFilter, setGroupFilter] = useState("all");
  const [message, setMessage] = useState("Ready");

  async function refresh(): Promise<void> {
    const rows = await window.termvault.listSnippets();
    setItems(rows);
  }

  useEffect(() => {
    refresh().catch(() => setMessage("Failed to load snippets"));
  }, []);

  const groups = useMemo(() => {
    const set = new Set(items.map((i) => i.group));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const visible = useMemo(() => {
    if (groupFilter === "all") {
      return items;
    }
    return items.filter((i) => i.group === groupFilter);
  }, [items, groupFilter]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!form.name.trim() || !form.group.trim() || !form.content.trim()) {
      setMessage("Please fill in name, group, and content.");
      return;
    }

    await window.termvault.addSnippet({
      name: form.name.trim(),
      group: form.group.trim(),
      content: form.content,
      type: form.type,
    });

    setForm(initialForm);
    await refresh();
    setMessage("Snippet saved.");
  }

  async function onCopy(content: string): Promise<void> {
    await window.termvault.copySnippetContent(content);
    setMessage("Copied to clipboard. Paste in terminal to run.");
  }

  async function onDelete(id: string): Promise<void> {
    await window.termvault.removeSnippet(id);
    await refresh();
    setMessage("Snippet deleted.");
  }

  return (
    <div className="layout">
      <aside className="panel form-panel">
        <h1>TermVault</h1>
        <p className="hint">Cross-platform terminal helper with grouped snippet vault.</p>

        <form onSubmit={onSubmit}>
          <label>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Docker Logs"
          />

          <label>Group</label>
          <input
            value={form.group}
            onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))}
            placeholder="git / docker / deploy"
          />

          <label>Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as SnippetType }))}
          >
            <option value="command">command</option>
            <option value="snippet">snippet</option>
          </select>

          <label>Content</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder="docker compose logs -f"
          />

          <button type="submit" className="primary">
            Save Snippet
          </button>
        </form>

        <div className="status">{message}</div>
      </aside>

      <main className="panel list-panel">
        <div className="toolbar">
          <h2>Snippets</h2>
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group === "all" ? "All groups" : group}
              </option>
            ))}
          </select>
        </div>

        <div className="list">
          {visible.length === 0 && <p className="empty">No snippets yet.</p>}

          {visible.map((item) => (
            <article key={item.id} className="snippet-card">
              <div className="snippet-meta">
                <span>{item.group}</span>
                <span>{item.type}</span>
              </div>
              <h3>{item.name}</h3>
              <pre>{item.content}</pre>
              <div className="actions">
                <button type="button" onClick={() => onCopy(item.content)}>
                  Copy
                </button>
                <button type="button" className="danger" onClick={() => onDelete(item.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
