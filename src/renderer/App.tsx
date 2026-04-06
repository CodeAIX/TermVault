import { useEffect, useMemo, useState } from "react";
import type { SnippetInput, SnippetItem, SnippetType } from "../shared/types";

declare global {
  interface Window {
    termvault: {
      listSnippets: () => Promise<SnippetItem[]>;
      addSnippet: (input: SnippetInput) => Promise<SnippetItem>;
      updateSnippet: (id: string, input: SnippetInput) => Promise<SnippetItem | null>;
      removeSnippet: (id: string) => Promise<boolean>;
      renameGroup: (oldGroup: string, newGroup: string) => Promise<boolean>;
      searchSnippets: (query: string) => Promise<SnippetItem[]>;
      toggleFavorite: (id: string) => Promise<boolean>;
      recordUsage: (id: string) => Promise<boolean>;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameOldGroup, setRenameOldGroup] = useState("");
  const [renameNewGroup, setRenameNewGroup] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SnippetItem[] | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

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

  const displayItems = useMemo(() => {
    let result = searchResults !== null ? searchResults : visible;

    if (showRecent) {
      result = result
        .filter((item) => item.lastUsed)
        .sort((a, b) => new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime())
        .slice(0, 10);
    } else if (showFavoritesOnly) {
      result = result.filter((item) => item.isFavorite);
    }

    return result;
  }, [searchResults, visible, showRecent, showFavoritesOnly]);

  function onEdit(item: SnippetItem): void {
    setEditingId(item.id);
    setForm({
      name: item.name,
      group: item.group,
      content: item.content,
      type: item.type,
    });
  }

  function cancelEdit(): void {
    setEditingId(null);
    setForm(initialForm);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!form.name.trim() || !form.group.trim() || !form.content.trim()) {
      setMessage("Please fill in name, group, and content.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      group: form.group.trim(),
      content: form.content,
      type: form.type,
    };

    if (editingId) {
      const updated = await window.termvault.updateSnippet(editingId, payload);
      if (!updated) {
        setMessage("Failed to update snippet.");
        return;
      }
      setEditingId(null);
      setMessage("Snippet updated.");
    } else {
      await window.termvault.addSnippet(payload);
      setMessage("Snippet saved.");
    }

    setForm(initialForm);
    await refresh();
  }

  async function onCopy(content: string): Promise<void> {
    await window.termvault.copySnippetContent(content);
    setMessage("Copied to clipboard. Paste in terminal to run.");
  }

  async function onToggleFavorite(id: string): Promise<void> {
    const ok = await window.termvault.toggleFavorite(id);
    if (ok) {
      await refresh();
      setMessage("Favorite toggled.");
    }
  }

  async function onCopyAndRecord(id: string, content: string): Promise<void> {
    await window.termvault.recordUsage(id);
    await onCopy(content);
  }

  async function onDelete(id: string): Promise<void> {
    await window.termvault.removeSnippet(id);
    await refresh();
    setMessage("Snippet deleted.");
  }

  async function onRenameGroupSubmit(): Promise<void> {
    if (!renameOldGroup.trim() || !renameNewGroup.trim()) {
      setMessage("Please fill in both group names.");
      return;
    }

    const ok = await window.termvault.renameGroup(renameOldGroup, renameNewGroup);
    if (!ok) {
      setMessage("Failed to rename group.");
      return;
    }

    setShowRenameModal(false);
    setRenameOldGroup("");
    setRenameNewGroup("");
    setGroupFilter("all");
    setSearchQuery("");
    setSearchResults(null);
    setShowFavoritesOnly(false);
    setShowRecent(false);
    await refresh();
    setMessage("Group renamed.");
  }

  async function onSearch(query: string): Promise<void> {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const results = await window.termvault.searchSnippets(query);
    setSearchResults(results);
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
            {editingId ? "Update Snippet" : "Save Snippet"}
          </button>

          {editingId && (
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </form>

        <button className="link" onClick={() => setShowRenameModal(true)}>
          Rename Group
        </button>

        <div className="status">{message}</div>
      </aside>

      <main className="panel list-panel">
        <div className="toolbar">
          <h2>Snippets</h2>
          <div className="toolbar-actions">
            {!searchResults && (
              <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
                {groups.map((group) => (
                  <option key={group} value={group}>
                    {group === "all" ? "All groups" : group}
                  </option>
                ))}
              </select>
            )}
            <button
              className={`toolbar-btn ${showFavoritesOnly ? "active" : ""}`}
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
                setShowRecent(false);
              }}
              title="Show favorites only"
            >
              ★
            </button>
            <button
              className={`toolbar-btn ${showRecent ? "active" : ""}`}
              onClick={() => {
                setShowRecent(!showRecent);
                setShowFavoritesOnly(false);
              }}
              title="Show recent snippets"
            >
              ⏱
            </button>
          </div>
        </div>

        <input
          type="text"
          className="search-box"
          placeholder="Search snippets..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
        />

        <div className="list">
          {displayItems.length === 0 && (
            <p className="empty">{searchResults !== null ? "No matching snippets." : "No snippets yet."}</p>
          )}

          {displayItems.map((item) => (
            <article key={item.id} className="snippet-card">
              <div className="snippet-header">
                <div className="snippet-meta">
                  <span>{item.group}</span>
                  <span>{item.type}</span>
                </div>
                <button
                  type="button"
                  className={`favorite-btn ${item.isFavorite ? "active" : ""}`}
                  onClick={() => onToggleFavorite(item.id)}
                  title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  ★
                </button>
              </div>
              <h3>{item.name}</h3>
              <pre>{item.content}</pre>
              <div className="snippet-footer">
                {item.lastUsed && (
                  <span className="last-used">
                    Last used: {new Date(item.lastUsed).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="actions">
                <button type="button" onClick={() => onCopyAndRecord(item.content, item.id)}>
                  Copy
                </button>
                <button type="button" onClick={() => onEdit(item)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDelete(item.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {showRenameModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Rename Group</h3>
            <p className="modal-hint">Change all snippets in one group to a new group name.</p>

            <label>Current Group Name</label>
            <input
              value={renameOldGroup}
              onChange={(e) => setRenameOldGroup(e.target.value)}
              placeholder="e.g. git"
            />

            <label>New Group Name</label>
            <input
              value={renameNewGroup}
              onChange={(e) => setRenameNewGroup(e.target.value)}
              placeholder="e.g. git-advanced"
            />

            <div className="modal-actions">
              <button type="button" className="primary" onClick={onRenameGroupSubmit}>
                Rename
              </button>
              <button type="button" onClick={() => setShowRenameModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
