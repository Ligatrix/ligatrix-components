#!/usr/bin/env node
// Checks tracked text files for trailing whitespace, tab characters and a
// missing final newline. Exits 1 and lists every problem found.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

const CHECKED = new Set([".mjs", ".js", ".ts", ".json", ".md", ".css", ".html", ".yml", ".yaml"]);

function listFiles() {
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" });
  return out.split("\n").filter((f) => f && (CHECKED.has(extname(f)) || f.endsWith(".editorconfig")));
}

const problems = [];
let checked = 0;
for (const file of listFiles()) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue; // deleted but not yet staged
  }
  checked += 1;
  if (text.length > 0 && !text.endsWith("\n")) problems.push(`${file}: missing final newline`);
  text.split("\n").forEach((line, i) => {
    if (/[ \t]+\r?$/.test(line)) problems.push(`${file}:${i + 1}: trailing whitespace`);
    if (line.includes("\t")) problems.push(`${file}:${i + 1}: tab character`);
  });
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s) in ${checked} files.`);
  process.exit(1);
}
console.log(`lint: ${checked} files clean.`);
