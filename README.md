# TermVault

TermVault is a terminal helper CLI to save and manage frequently used commands/code snippets.

## Features

- Save command/snippet with a custom name.
- Group snippets (for example: git, docker, deploy).
- List snippets by group.
- Copy snippet content to clipboard with one command.
- Run a command snippet directly from CLI.
- Interactive picker mode.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start in dev mode:

```bash
npm run dev -- --help
```

3. Build:

```bash
npm run build
```

4. Run built CLI:

```bash
npm run start -- --help
```

## Usage

Add a snippet:

```bash
npm run dev -- add -n "List files" -g "shell" -c "ls -la" -t command
```

List all snippets:

```bash
npm run dev -- list
```

List by group:

```bash
npm run dev -- list -g shell
```

Show all groups:

```bash
npm run dev -- groups
```

Copy snippet to clipboard:

```bash
npm run dev -- copy "List files"
```

Run snippet directly:

```bash
npm run dev -- run "List files"
```

Interactive mode:

```bash
npm run dev -- interactive
```

Remove snippet:

```bash
npm run dev -- remove "List files"
```

Show database path:

```bash
npm run dev -- path
```

## Data Storage

By default, snippets are saved in:

- `~/.termvault/db.json`

## Publish to GitHub (Step by Step)

1. Initialize git:

```bash
git init
```

2. Commit:

```bash
git add .
git commit -m "feat: initial termvault cli"
```

3. Create a GitHub repo in browser, then connect remote:

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
```

4. Push:

```bash
git branch -M main
git push -u origin main
```

## Notes

- `run` executes content in shell mode. Please only run trusted snippets.
- If multiple snippets share same name, pass `-g <group>` to disambiguate.
