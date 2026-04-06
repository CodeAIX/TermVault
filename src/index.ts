#!/usr/bin/env node
import clipboard from "clipboardy";
import { Command } from "commander";
import inquirer from "inquirer";
import { spawn } from "node:child_process";
import { addSnippet, dbFilePath, getSnippet, listGroups, listSnippets, removeSnippet } from "./store.js";
import type { SnippetType } from "./types.js";

const program = new Command();

function snippetQuery(idOrName: string, group?: string): { idOrName: string; group?: string } {
  return group ? { idOrName, group } : { idOrName };
}

program
  .name("termvault")
  .description("Manage terminal commands/code snippets with groups and one-click copy")
  .version("0.1.0");

program
  .command("add")
  .description("Add a command/snippet")
  .requiredOption("-n, --name <name>", "Name of snippet")
  .requiredOption("-g, --group <group>", "Group name")
  .requiredOption("-c, --content <content>", "Snippet content")
  .option("-t, --type <type>", "Type: command|snippet", "command")
  .action((opts: { name: string; group: string; content: string; type: SnippetType }) => {
    const type = opts.type === "snippet" ? "snippet" : "command";
    const created = addSnippet({
      name: opts.name,
      group: opts.group,
      content: opts.content,
      type,
    });

    console.log(`Saved: ${created.name} (${created.group}) [${created.id}]`);
  });

program
  .command("list")
  .description("List snippets")
  .option("-g, --group <group>", "Filter by group")
  .action((opts: { group?: string }) => {
    const rows = listSnippets(opts.group);
    if (rows.length === 0) {
      console.log("No snippets found.");
      return;
    }

    for (const s of rows) {
      console.log(`${s.id} | ${s.group} | ${s.type} | ${s.name}`);
    }
  });

program
  .command("groups")
  .description("List groups")
  .action(() => {
    const groups = listGroups();
    if (groups.length === 0) {
      console.log("No groups found.");
      return;
    }

    for (const g of groups) {
      console.log(g);
    }
  });

program
  .command("copy")
  .description("Copy snippet content to clipboard")
  .argument("<idOrName>", "Snippet id or name")
  .option("-g, --group <group>", "Group filter when name duplicates")
  .action(async (idOrName: string, opts: { group?: string }) => {
    const target = getSnippet(snippetQuery(idOrName, opts.group));
    if (!target) {
      console.error("Snippet not found.");
      process.exitCode = 1;
      return;
    }

    await clipboard.write(target.content);
    console.log(`Copied: ${target.name}. Paste in terminal and press Enter.`);
  });

program
  .command("run")
  .description("Execute a command snippet directly")
  .argument("<idOrName>", "Snippet id or name")
  .option("-g, --group <group>", "Group filter when name duplicates")
  .action((idOrName: string, opts: { group?: string }) => {
    const target = getSnippet(snippetQuery(idOrName, opts.group));
    if (!target) {
      console.error("Snippet not found.");
      process.exitCode = 1;
      return;
    }

    const child = spawn(target.content, {
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code: number | null) => {
      process.exitCode = code ?? 0;
    });
  });

program
  .command("remove")
  .description("Remove a snippet")
  .argument("<idOrName>", "Snippet id or name")
  .option("-g, --group <group>", "Group filter when name duplicates")
  .action((idOrName: string, opts: { group?: string }) => {
    const ok = removeSnippet(snippetQuery(idOrName, opts.group));
    if (!ok) {
      console.error("Snippet not found.");
      process.exitCode = 1;
      return;
    }

    console.log("Removed.");
  });

program
  .command("interactive")
  .description("Open interactive picker")
  .action(async () => {
    const rows = listSnippets();
    if (rows.length === 0) {
      console.log("No snippets found. Use add command first.");
      return;
    }

    const { pickedId } = await inquirer.prompt<{ pickedId: string }>([
      {
        type: "list",
        name: "pickedId",
        message: "Select snippet:",
        choices: rows.map((s) => ({
          name: `[${s.group}] ${s.name} (${s.type})`,
          value: s.id,
        })),
      },
    ]);

    const target = rows.find((s) => s.id === pickedId);
    if (!target) {
      console.error("Snippet not found.");
      process.exitCode = 1;
      return;
    }

    const { action } = await inquirer.prompt<{ action: "copy" | "run" }>([
      {
        type: "list",
        name: "action",
        message: "Next action:",
        choices: [
          { name: "Copy to clipboard", value: "copy" },
          { name: "Run directly", value: "run" },
        ],
      },
    ]);

    if (action === "copy") {
      await clipboard.write(target.content);
      console.log(`Copied: ${target.name}`);
      return;
    }

    const child = spawn(target.content, {
      stdio: "inherit",
      shell: true,
    });

    child.on("exit", (code: number | null) => {
      process.exitCode = code ?? 0;
    });
  });

program
  .command("path")
  .description("Print local database path")
  .action(() => {
    console.log(dbFilePath());
  });

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.outputHelp();
}
