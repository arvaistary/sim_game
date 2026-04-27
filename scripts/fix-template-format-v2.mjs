/**
 * Корректный скрипт форматирования Vue-шаблонов.
 *
 * Возможности:
 * 1. Раскрытие однострочных тегов с 2+ атрибутами в многострочные
 * 2. Раскрытие инлайн-контента (тег с атрибутами и контентом на одной строке)
 * 3. Сортировка атрибутов: директивы (v-*, @*, :*) перед статическими (class, id, ...)
 *
 * Ключевое отличие от предыдущих версий: правильный парсинг атрибутов
 * с учётом кавычек, фигурных скобок и `>` внутри значений.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

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

/**
 * Проверяет, является ли атрибут директивой (v-*, @*, :*).
 */
function isDirectiveAttr(attrText) {
  const trimmed = attrText.trim();
  return /^(v-|@|:)/.test(trimmed);
}

/**
 * Парсит один тег из текста начиная с позиции startIdx.
 * Корректно обрабатывает кавычки, фигурные скобки и `>` внутри значений.
 *
 * Возвращает { tagName, attrs: [{name, value, raw}], selfClosing, endIndex }
 * или null если не удалось распарсить.
 */
function parseTag(text, startIdx) {
  let pos = startIdx;

  // Пропускаем <
  if (text[pos] !== '<') return null;
  pos++;

  // Читаем имя тега
  const nameMatch = text.slice(pos).match(/^[a-zA-Z][a-zA-Z0-9-]*/);
  if (!nameMatch) return null;
  const tagName = nameMatch[0];
  pos += tagName.length;

  const attrs = [];

  // Читаем атрибуты
  while (pos < text.length) {
    // Пропускаем пробелы
    while (pos < text.length && /\s/.test(text[pos])) pos++;
    if (pos >= text.length) return null;

    // Проверяем конец тега
    if (text[pos] === '>' || (text[pos] === '/' && pos + 1 < text.length && text[pos + 1] === '>')) {
      const selfClosing = text[pos] === '/';
      const endIndex = pos + (selfClosing ? 2 : 1);
      return { tagName, attrs, selfClosing, endIndex };
    }

    // Читаем имя атрибута
    const attrNameMatch = text.slice(pos).match(/^([@:]?v?[a-zA-Z][a-zA-Z0-9:._-]*)/);
    if (!attrNameMatch) return null;
    const attrName = attrNameMatch[1];
    pos += attrName.length;

    // Пропускаем пробелы
    while (pos < text.length && /\s/.test(text[pos])) pos++;

    // Проверяем есть ли значение (=)
    let attrValue = null;
    let rawAttr = attrName;

    if (pos < text.length && text[pos] === '=') {
      pos++; // пропускаем =
      rawAttr += '=';

      // Пропускаем пробелы
      while (pos < text.length && /\s/.test(text[pos])) pos++;

      if (pos >= text.length) return null;

      const quote = text[pos];
      if (quote === '"' || quote === "'") {
        // Значение в кавычках — читаем до закрывающей кавычки
        pos++; // пропускаем открывающую кавычку
        let value = '';
        while (pos < text.length && text[pos] !== quote) {
          // Обрабатываем экранированные кавычки
          if (text[pos] === '\\' && pos + 1 < text.length) {
            value += text[pos] + text[pos + 1];
            pos += 2;
          } else {
            value += text[pos];
            pos++;
          }
        }
        if (pos >= text.length) return null;
        pos++; // пропускаем закрывающую кавычку
        attrValue = value;
        rawAttr += `${quote}${value}${quote}`;
      } else if (text[pos] === '`') {
        // Template literal
        pos++;
        let value = '';
        while (pos < text.length && text[pos] !== '`') {
          if (text[pos] === '\\' && pos + 1 < text.length) {
            value += text[pos] + text[pos + 1];
            pos += 2;
          } else {
            value += text[pos];
            pos++;
          }
        }
        if (pos >= text.length) return null;
        pos++;
        attrValue = value;
        rawAttr += '`' + value + '`';
      } else {
        // Значение без кавычек (boolean attribute или число)
        let value = '';
        while (pos < text.length && !/[\s>]/.test(text[pos])) {
          value += text[pos];
          pos++;
        }
        attrValue = value;
        rawAttr += value;
      }
    }

    attrs.push({ name: attrName, value: attrValue, raw: rawAttr });
  }

  return null;
}

/**
 * Находит границы template секции в файле.
 */
function findTemplateBounds(lines) {
  let templateStart = -1;
  let templateEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^<template>/.test(lines[i].trim())) templateStart = i + 1;
    if (/^<\/template>/.test(lines[i].trim())) templateEnd = i;
  }
  return { templateStart, templateEnd };
}

/**
 * Получает отступ строки.
 */
function getIndent(line) {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

let totalFixes = 0;

const filePaths = [];
walkDirectory(targetPath, (filePath) => filePaths.push(filePath));

for (const filePath of filePaths) {
  if (!filePath.endsWith('.vue')) continue;

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const { templateStart, templateEnd } = findTemplateBounds(lines);
  if (templateStart < 0 || templateEnd < 0) continue;

  let modified = false;

  // Обрабатываем строки в обратном порядке, чтобы не сбить индексы
  for (let i = templateEnd - 1; i >= templateStart; i--) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Пропускаем пустые строки, комментарии, закрывающие теги
    if (!trimmedLine || trimmedLine.startsWith('<!--') || trimmedLine.startsWith('</')) {
      continue;
    }

    // Ищем открывающий тег в начале строки
    const tagStartMatch = trimmedLine.match(/^<([a-zA-Z][a-zA-Z0-9-]*)/);
    if (!tagStartMatch) continue;

    const tagStartInLine = trimmedLine.indexOf('<');
    const indent = getIndent(line);

    // Собираем полный текст тега (может быть многострочным)
    let fullText = '';
    let startLine = i;
    for (let j = i; j < lines.length; j++) {
      fullText += (j === i ? '' : '\n') + lines[j];
      // Пробуем распарсить тег начиная с начала строки
      const tagOffset = lines[i].indexOf('<');
      const parsed = parseTag(lines.slice(i, j + 1).join('\n'), Math.max(0, tagOffset));

      if (parsed) {
        // Нашли закрывающий >
        break;
      }
    }

    // Парсим тег из текущей строки
    const lineOffset = line.indexOf('<');
    const parsed = parseTag(line, lineOffset);

    if (!parsed) {
      // Возможно тег многострочный — собираем строки
      let collected = line;
      let endJ = i + 1;
      let parsedMulti = null;

      while (endJ < lines.length && !parsedMulti) {
        collected += '\n' + lines[endJ];
        parsedMulti = parseTag(collected, lineOffset);
        if (!parsedMulti) endJ++;
      }

      if (!parsedMulti) continue;

      // Обрабатываем многострочный тег
      const { tagName: tn, attrs: tagAttrs, selfClosing, endIndex: endIdx } = parsedMulti;

      if (tagAttrs.length < 2) continue;

      // Проверяем нужна ли сортировка
      const sortedAttrs = [...tagAttrs].sort((a, b) => {
        const aDir = isDirectiveAttr(a.raw) ? 0 : 1;
        const bDir = isDirectiveAttr(b.raw) ? 0 : 1;
        return aDir - bDir;
      });

      // Проверяем изменился ли порядок
      let orderChanged = false;
      for (let k = 0; k < tagAttrs.length; k++) {
        if (tagAttrs[k].raw !== sortedAttrs[k].raw) {
          orderChanged = true;
          break;
        }
      }

      if (!orderChanged) continue;

      // Заменяем атрибуты в многострочном теге
      const attrIndent = indent + '  ';
      const newLines = [];
      newLines.push(`${indent}<${tn}`);
      for (const attr of sortedAttrs) {
        newLines.push(`${attrIndent}${attr.raw}`);
      }
      newLines.push(`${attrIndent}${selfClosing ? '/>' : '>'}`);

      lines.splice(i, endJ - i + 1, ...newLines);
      modified = true;
      totalFixes++;
      continue;
    }

    const { tagName: tn, attrs: tagAttrs, selfClosing, endIndex: endIdx } = parsed;

    // Проверяем есть ли контент после > на той же строке
    const afterTag = line.slice(endIdx);
    const hasInlineContent = afterTag.length > 0 && !afterTag.trim().startsWith('</');

    // Проверяем есть ли закрывающий тег на той же строке
    const closeTagRegex = new RegExp(`<\\/(${tn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})>`, 'g');
    closeTagRegex.lastIndex = endIdx;
    const closeMatch = closeTagRegex.exec(line);
    const hasCloseTagOnSameLine = closeMatch !== null;

    // Извлекаем контент между > и </tag>
    let inlineContent = '';
    if (hasCloseTagOnSameLine) {
      inlineContent = line.slice(endIdx, closeMatch.index).trim();
    }

    if (tagAttrs.length >= 2) {
      // Сортируем атрибуты: директивы перед статическими
      const sortedAttrs = [...tagAttrs].sort((a, b) => {
        const aDir = isDirectiveAttr(a.raw) ? 0 : 1;
        const bDir = isDirectiveAttr(b.raw) ? 0 : 1;
        return aDir - bDir;
      });

      const attrIndent = indent + '  ';
      const newLines = [];
      newLines.push(`${indent}<${tn}`);

      for (const attr of sortedAttrs) {
        newLines.push(`${attrIndent}${attr.raw}`);
      }

      if (hasCloseTagOnSameLine && inlineContent.length > 0) {
        // Тег с контентом на одной строке — раскрываем
        newLines.push(`${attrIndent}>`);
        newLines.push(`${attrIndent}${inlineContent}`);
        newLines.push(`${indent}</${tn}>`);
      } else if (selfClosing) {
        // Самозакрывающийся тег
        newLines.push(`${attrIndent}/>`);
      } else {
        newLines.push(`${attrIndent}>`);
      }

      // Заменяем строку
      lines.splice(i, 1, ...newLines);
      modified = true;
      totalFixes++;
    }
  }

  if (modified) {
    writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`Fixed: ${relative(repoRoot, filePath)}`);
  }
}

console.log(`\nTotal: ${totalFixes} template formatting fix(es) applied.`);
