import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

const repoRoot = process.cwd();
const inputTarget = process.argv[2] ?? 'src';
const targetPath = resolve(repoRoot, inputTarget);
const skippedDirectoryNames = new Set(['node_modules', '.nuxt', '.output', '.git']);

function walkDirectory(pathname, collector) {
  const stats = statSync(pathname);
  if (stats.isFile()) {
    collector(pathname);
    return;
  }
  const entries = readdirSync(pathname, { withFileTypes: true });
  for (const entry of entries) {
    if (skippedDirectoryNames.has(entry.name)) continue;
    walkDirectory(resolve(pathname, entry.name), collector);
  }
}

let totalFixes = 0;
const filePaths = [];
walkDirectory(targetPath, (filePath) => filePaths.push(filePath));

for (const filePath of filePaths) {
  if (!filePath.endsWith('.vue')) continue;

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  let modified = false;

  // Find template section boundaries
  let templateStart = -1;
  let templateEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^<template>/.test(lines[i].trim())) templateStart = i + 1;
    if (/^<\/template>/.test(lines[i].trim())) templateEnd = i;
  }

  if (templateStart < 0 || templateEnd < 0) continue;

  // Process lines in reverse order to avoid offset issues when inserting new lines
  for (let i = templateEnd - 1; i >= templateStart; i--) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines, comments, closing tags, self-closing tags
    if (!trimmedLine || trimmedLine.startsWith('<!--') || trimmedLine.startsWith('</') || trimmedLine.endsWith('/>')) {
      continue;
    }

    // Check for inline content: <tag ...>content</tag> on a single line
    const inlineMatch = trimmedLine.match(/^<([a-zA-Z][a-zA-Z0-9-]*)((?:\s[^>]*)?)>([^<]+)<\/([a-zA-Z]+)>$/);
    if (inlineMatch) {
      const tagName = inlineMatch[1];
      const attrs = inlineMatch[2] || '';
      const contentText = inlineMatch[3].trim();
      const closingTag = inlineMatch[4];

      if (contentText.length > 0 && tagName === closingTag) {
        // Get the indentation of the current line
        const indent = line.match(/^(\s*)/)[1];
        const innerIndent = indent + '  ';

        // Check if this also has multi-attr (2+ attributes)
        const attrMatches = attrs.match(/\s+[a-zA-Z@:][a-zA-Z0-9:._-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`))?/g);
        const attrCount = attrMatches ? attrMatches.length : 0;

        if (attrCount >= 2) {
          // Multi-attr + inline content: split both
          const newLines = [];
          newLines.push(`${indent}<${tagName}`);

          for (const attr of attrMatches) {
            newLines.push(`${innerIndent}${attr.trim()}`);
          }

          newLines.push(`${innerIndent}>`);
          newLines.push(`${innerIndent}${contentText}`);
          newLines.push(`${indent}</${tagName}>`);

          lines.splice(i, 1, ...newLines);
          modified = true;
          totalFixes++;
        } else {
          // Single attr or no attr + inline content
          const openingTag = attrs ? `<${tagName}${attrs}>` : `<${tagName}>`;
          const newLines = [];
          newLines.push(`${indent}${openingTag}`);
          newLines.push(`${innerIndent}${contentText}`);
          newLines.push(`${indent}</${tagName}>`);

          lines.splice(i, 1, ...newLines);
          modified = true;
          totalFixes++;
        }

        continue;
      }
    }

    // Check for multi-attr opening tag on a single line (without inline content)
    const multiAttrMatch = trimmedLine.match(/^<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^>\/]+)+)\s*>$/);
    if (multiAttrMatch) {
      const tagName = multiAttrMatch[1];
      const attrsPart = multiAttrMatch[2];
      const attrMatches = attrsPart.match(/\s+[a-zA-Z@:][a-zA-Z0-9:._-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`))?/g);
      const attrCount = attrMatches ? attrMatches.length : 0;

      if (attrCount >= 2) {
        const indent = line.match(/^(\s*)/)[1];
        const innerIndent = indent + '  ';

        const newLines = [];
        newLines.push(`${indent}<${tagName}`);

        for (const attr of attrMatches) {
          newLines.push(`${innerIndent}${attr.trim()}`);
        }

        newLines.push(`${innerIndent}>`);

        lines.splice(i, 1, ...newLines);
        modified = true;
        totalFixes++;
      }
    }
  }

  if (modified) {
    writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`Fixed template formatting in ${relative(repoRoot, filePath)}`);
  }
}

console.log(`\nTotal: ${totalFixes} template formatting fix(es) applied.`);
