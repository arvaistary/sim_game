import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const inputTarget = process.argv[2] ?? 'src';
const targetPath = resolve(repoRoot, inputTarget);
const skippedDirectoryNames = new Set(['node_modules', '.nuxt', '.output', '.git']);

if (!existsSync(targetPath)) {
  console.error(`Target does not exist: ${inputTarget}`);
  process.exit(2);
}

const findings = [];

// Сохраняет найденное нарушение в общем списке, сразу нормализуя путь относительно корня репозитория.
function pushFinding(rule, filePath, details) {
  findings.push({
    rule,
    filePath: relative(repoRoot, filePath),
    details,
  });
}

// Рекурсивно обходит директорию с кодом и передает каждый найденный файл в коллектор.
function walkDirectory(pathname, collector) {
  const stats = statSync(pathname);

  if (stats.isFile()) {
    collector(pathname);
    return;
  }

  const entries = readdirSync(pathname, { withFileTypes: true });
  for (const entry of entries) {
    if (skippedDirectoryNames.has(entry.name)) {
      continue;
    }

    walkDirectory(resolve(pathname, entry.name), collector);
  }
}

// Проверяет, относится ли файл к `src/components/ui`, где действуют отдельные архитектурные исключения.
function isFileInComponentsUi(absolutePath) {
  const normalizedPath = absolutePath.split(sep).join('/');
  return normalizedPath.includes('/src/components/ui/');
}

// Проверяет, можно ли считать конец выражения валидным основанием для продолжения цепочки вызовов на следующей строке.
function hasChainReceiverAtLineEnd(value) {
  return /(?:[A-Za-z_$][\w$.\]?]*|\([^)]*\))$/.test(value.trim());
}

// Определяет, подходит ли выражение под "простой" `return`, который должен быть оформлен в одну строку.
function isSimpleGuardReturnExpression(value) {
  const normalizedValue = value.trim();
  return (
    normalizedValue === '' ||
    /^(?:''|""|null|undefined|true|false|0|1)$/.test(normalizedValue) ||
    /^[A-Za-z_$][\w$]*$/.test(normalizedValue) ||
    /^[A-Za-z_$][\w$]*\(\s*[A-Za-z_$][\w$]*\s*\)$/.test(normalizedValue)
  );
}

// Вычисляет номер строки по смещению в файле, чтобы можно было привязать regex-совпадение к понятному report line.
function getLineNumberByOffset(content, offset) {
  const contentBeforeOffset = content.slice(0, offset);
  return contentBeforeOffset.split(/\r?\n/).length;
}

function getTsDocBeforeLine(lines, lineIndex) {
  let currentIndex = lineIndex - 1;

  while (currentIndex >= 0 && lines[currentIndex].trim() === '') {
    currentIndex -= 1;
  }

  if (currentIndex < 0 || !lines[currentIndex].trim().endsWith('*/')) {
    return null;
  }

  const commentLines = [];

  while (currentIndex >= 0) {
    const line = lines[currentIndex].trim();
    commentLines.unshift(line);
    if (line.startsWith('/**')) {
      return commentLines.join('\n');
    }

    if (line.startsWith('/*') && !line.startsWith('/**')) {
      return null;
    }

    currentIndex -= 1;
  }

  return null;
}

// Проверяет порядок блоков внутри <script setup lang="ts"> в Vue SFC.
function runVueScriptBlockOrderHeuristics({ filePath, lines }) {
  // Ищем начало <script setup lang="ts"> блока
  const scriptStartPattern = /^<script\s+setup\s+lang="ts"\s*>/;

  for (let index = 0; index < lines.length; index += 1) {
    if (!scriptStartPattern.test(lines[index].trim())) {
      continue;
    }

    const blockOrder = [
      'imports',
      'props',
      'emits',
      'routing',
      'stores',
      'components',
      'derived',
      'state',
      'computed',
      'handlers',
      'lifecycle',
      'guards',
    ];

    const blockOrderRank = new Map(blockOrder.map((blockName, blockIndex) => [blockName, blockIndex]));
    const firstSeenByBlock = new Map();
    const seenBlocksInOrder = [];
    let scriptDepth = 1; // 1 = внутри script блока
    let cursor = index + 1;

    while (cursor < lines.length && scriptDepth > 0) {
      const line = lines[cursor];
      const trimmedLine = line.trim();

      const openingBracesCount = (line.match(/\{/g) ?? []).length;
      const closingBracesCount = (line.match(/\}/g) ?? []).length;

      if (scriptDepth === 1 && trimmedLine) {
        let blockName = null;

        // Props definition
        if (/^(const\s+[A-Za-z_$][\w$]*\s*=\s*)?defineProps(?:<|<\s*\{)/.test(trimmedLine) ||
            /^withDefaults\s*\(\s*defineProps/.test(trimmedLine)) {
          blockName = 'props';
        }
        // Emits definition
        else if (/^const\s+[A-Za-z_$][\w$]*\s*=\s*defineEmits/.test(trimmedLine) ||
                 /^defineEmits\s*\(/.test(trimmedLine)) {
          blockName = 'emits';
        }
        // Routing
        else if (/^const\s+[A-Za-z_$][\w$]*\s*=\s*useRouter\(/.test(trimmedLine) ||
                 /^const\s+[A-Za-z_$][\w$]*\s*=\s*useRoute\(/.test(trimmedLine)) {
          blockName = 'routing';
        }
        // Pinia stores
        else if (/^const\s+[A-Za-z_$][\w$]*\s*=\s*use\w+Store\(/.test(trimmedLine)) {
          blockName = 'stores';
        }
        // defineAsyncComponent
        else if (/^const\s+[A-Za-z_$][\w$]*\s*=\s*defineAsyncComponent\(/.test(trimmedLine)) {
          blockName = 'components';
        }
        // ref/reactive state
        else if (/^const\s+[A-Za-z_$][\w$]*\s*=\s*ref\(/.test(trimmedLine) ||
                 /^const\s+[A-Za-z_$][\w$]*\s*=\s*reactive\(/.test(trimmedLine)) {
          blockName = 'state';
        }
        // computed
        else if (/^const\s+[A-Za-z_$][\w$]*\s*=\s*computed\(/.test(trimmedLine)) {
          blockName = 'computed';
        }
        // Handlers (functions starting with action verbs)
        else if (/^(?:async\s+)?function\s+(?:handle|get|load|update|create|remove|fetch|toggle)[A-Z][A-Za-z0-9_]*\(/.test(trimmedLine)) {
          blockName = 'handlers';
        }
        else if (/^const\s+(?:handle|get|load|update|create|remove|fetch|toggle)[A-Za-z_$][\w$]*\s*[:=]/.test(trimmedLine)) {
          blockName = 'handlers';
        }
        // Lifecycle hooks
        else if (/^(onMounted|onUnmounted|onBeforeMount|onBeforeUnmount|onUpdated|watch|watchEffect)\s*\(/.test(trimmedLine)) {
          blockName = 'lifecycle';
        }
        // Guard conditions
        else if (/^if\s*\(/.test(trimmedLine)) {
          blockName = 'guards';
        }
        // Derived constants (typed const declarations that are not state/computed)
        else if (/^const\s+[A-Za-z_$][\w$]*\s*:/.test(trimmedLine) &&
                 !/^const\s+\[[^\]]+\]/.test(trimmedLine)) {
          blockName = 'derived';
        }

        if (blockName && !firstSeenByBlock.has(blockName)) {
          firstSeenByBlock.set(blockName, cursor + 1);
          seenBlocksInOrder.push({
            blockName,
            lineNumber: cursor + 1,
          });
        }
      }

      scriptDepth += openingBracesCount - closingBracesCount;
      cursor += 1;
    }

    let maxSeenRank = -1;
    for (const blockName of blockOrder) {
      if (!firstSeenByBlock.has(blockName)) {
        continue;
      }

      const currentRank = blockOrderRank.get(blockName);
      if (currentRank < maxSeenRank) {
        const lineNumber = firstSeenByBlock.get(blockName);
        pushFinding(
          'style/script-setup-block-order',
          filePath,
          `Line ${lineNumber}: move "${blockName}" block earlier to keep <script setup> block order`,
        );
        break;
      }

      maxSeenRank = currentRank;
    }

    for (let blockIndex = 1; blockIndex < seenBlocksInOrder.length; blockIndex += 1) {
      const previousBlock = seenBlocksInOrder[blockIndex - 1];
      const currentBlock = seenBlocksInOrder[blockIndex];

      if (previousBlock.blockName === currentBlock.blockName) {
        continue;
      }

      // Stores block can be followed by components block without blank line
      if (previousBlock.blockName === 'stores') {
        continue;
      }

      const currentLineIndex = currentBlock.lineNumber - 1;
      const previousLine = lines[currentLineIndex - 1] ?? '';
      const hasBlankLineBeforeCurrentBlock = previousLine.trim() === '';

      if (hasBlankLineBeforeCurrentBlock) {
        continue;
      }

      pushFinding(
        'style/script-setup-block-separation',
        filePath,
        `Line ${currentBlock.lineNumber}: add an empty line between "${previousBlock.blockName}" and "${currentBlock.blockName}" blocks`,
      );
    }
  }
}

// Проверяет пустую строку после группы Pinia store вызовов перед локальными вычислениями и state.
function runPiniaStoreGroupSeparationHeuristics({ filePath, lines }) {
  const scriptStartPattern = /^<script\s+setup\s+lang="ts"\s*>/;
  const storeConstStartPattern = /^\s*const\s+[^=]+\s*=\s*use\w+Store\(/;

  for (let index = 0; index < lines.length; index += 1) {
    if (!scriptStartPattern.test(lines[index].trim())) {
      continue;
    }

    let scriptDepth = 1;
    let cursor = index + 1;

    while (cursor < lines.length && scriptDepth > 0) {
      const line = lines[cursor];
      const trimmedLine = line.trim();
      const openingBracesCount = (line.match(/\{/g) ?? []).length;
      const closingBracesCount = (line.match(/\}/g) ?? []).length;

      if (scriptDepth === 1 && trimmedLine && storeConstStartPattern.test(trimmedLine)) {
        let chainEndLineIdx = cursor;
        let scanLine = cursor;

        while (scanLine < lines.length) {
          const scanTrim = lines[scanLine].trim();
          if (!storeConstStartPattern.test(scanTrim)) {
            break;
          }

          chainEndLineIdx = scanLine;
          scanLine = chainEndLineIdx + 1;

          while (scanLine < lines.length && lines[scanLine].trim() === '') {
            scanLine += 1;
          }
        }

        const lineAfterLastStore = lines[chainEndLineIdx + 1];
        if (lineAfterLastStore !== undefined && lineAfterLastStore.trim() !== '') {
          pushFinding(
            'style/blank-line-after-store-block',
            filePath,
            `Line ${chainEndLineIdx + 2}: add an empty line after the use*Store(...) block(s) before local derivations and state`,
          );
        }

        for (let lineIdx = cursor; lineIdx <= chainEndLineIdx; lineIdx += 1) {
          const scanLineContent = lines[lineIdx];
          scriptDepth +=
            (scanLineContent.match(/\{/g) ?? []).length -
            (scanLineContent.match(/\}/g) ?? []).length;
        }

        cursor = chainEndLineIdx + 1;
        continue;
      }

      scriptDepth += openingBracesCount - closingBracesCount;
      cursor += 1;
    }
  }
}

function countTopLevelFunctionParams(paramsText) {
  let paramsCount = 0;
  let tokenStarted = false;
  let angleDepth = 0;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateString = false;

  for (let index = 0; index < paramsText.length; index += 1) {
    const currentChar = paramsText[index];
    const previousChar = index > 0 ? paramsText[index - 1] : '';
    const isEscaped = previousChar === '\\';

    if (inSingleQuote) {
      if (currentChar === "'" && !isEscaped) {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (currentChar === '"' && !isEscaped) {
        inDoubleQuote = false;
      }
      continue;
    }

    if (inTemplateString) {
      if (currentChar === '`' && !isEscaped) {
        inTemplateString = false;
      }
      continue;
    }

    if (currentChar === "'") {
      inSingleQuote = true;
      tokenStarted = true;
      continue;
    }

    if (currentChar === '"') {
      inDoubleQuote = true;
      tokenStarted = true;
      continue;
    }

    if (currentChar === '`') {
      inTemplateString = true;
      tokenStarted = true;
      continue;
    }

    if (currentChar === '<') {
      angleDepth += 1;
      tokenStarted = true;
      continue;
    }

    if (currentChar === '>') {
      angleDepth = Math.max(0, angleDepth - 1);
      tokenStarted = true;
      continue;
    }

    if (currentChar === '(') {
      parenDepth += 1;
      tokenStarted = true;
      continue;
    }

    if (currentChar === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      tokenStarted = true;
      continue;
    }

    if (currentChar === '{') {
      braceDepth += 1;
      tokenStarted = true;
      continue;
    }

    if (currentChar === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      tokenStarted = true;
      continue;
    }

    if (currentChar === '[') {
      bracketDepth += 1;
      tokenStarted = true;
      continue;
    }

    if (currentChar === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      tokenStarted = true;
      continue;
    }

    if (
      currentChar === ',' &&
      angleDepth === 0 &&
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0
    ) {
      paramsCount += 1;
      tokenStarted = false;
      continue;
    }

    if (!/\s/.test(currentChar)) {
      tokenStarted = true;
    }
  }

  if (!tokenStarted && paramsCount === 0) {
    return 0;
  }

  return paramsCount + 1;
}

// Проверяет дополнительные локальные стилевые соглашения для Vue/Nuxt/Pinia.
function runAdditionalStyleHeuristics({ content, filePath, lines }) {
  let braceDepth = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (
      braceDepth === 0 &&
      /^(export\s+)?(const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(async\s*)?(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(trimmedLine)
    ) {
      pushFinding(
        'style/prefer-function-declaration',
        filePath,
        `Line ${index + 1}: prefer function declarations instead of arrow functions for non-callback declarations`,
      );
    }

    if (braceDepth === 0 && /^(export\s+)?(const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(async\s*)?function\b/.test(trimmedLine)) {
      pushFinding(
        'style/prefer-function-declaration',
        filePath,
        `Line ${index + 1}: prefer function declarations instead of function expressions`,
      );
    }

    const openingBracesCount = (line.match(/\{/g) ?? []).length;
    const closingBracesCount = (line.match(/\}/g) ?? []).length;
    braceDepth += openingBracesCount - closingBracesCount;
    if (braceDepth < 0) {
      braceDepth = 0;
    }
  });

  for (let index = 1; index < lines.length; index += 1) {
    const currentTrimmedLine = lines[index].trim();
    const previousTrimmedLine = lines[index - 1].trim();

    if (!/^if\s*\(/.test(currentTrimmedLine)) {
      continue;
    }

    if (!previousTrimmedLine) {
      continue;
    }

    if (previousTrimmedLine.endsWith('{')) {
      continue;
    }

    if (/^(const|let|var)\b/.test(previousTrimmedLine)) {
      continue;
    }

    pushFinding('style/blank-line-before-if', filePath, `Line ${index + 1}: keep an empty line before if blocks`);
  }

  for (let index = 0; index < lines.length; index += 1) {
    const trimmedLine = lines[index].trim();
    const hasVoidCallPattern = /^void\s+[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\s*\([^;]*\)\s*;\s*$/.test(trimmedLine);

    if (!hasVoidCallPattern) {
      continue;
    }

    pushFinding(
      'style/no-void-fire-and-forget',
      filePath,
      `Line ${index + 1}: avoid "void fn()"; use await/return or explicit error handling`,
    );
  }

  // Vue lifecycle hooks callback check: onMounted, watch, etc. should use inline arrow functions
  const hookOpenPattern = /\b(onMounted|onUnmounted|onBeforeMount|onBeforeUnmount|onUpdated|watch|watchEffect)\s*\(\s*$/;

  for (let index = 0; index < lines.length - 1; index += 1) {
    const currentTrimmedLine = lines[index].trim();
    const nextTrimmedLine = lines[index + 1].trim();

    const hookOpenMatch = currentTrimmedLine.match(hookOpenPattern);
    if (!hookOpenMatch) {
      continue;
    }

    if (/^\s*(async\s*)?\([^)]*\)\s*=>/.test(nextTrimmedLine)) {
      const hookName = hookOpenMatch[1];
      pushFinding(
        'style/hooks-callback-inline',
        filePath,
        `Line ${index + 1}: place ${hookName} callback inline: ${hookName}(() => { ... });`,
      );
    }
  }

  // Named function in Vue lifecycle hooks
  const hookNamedFunctionPattern =
    /\b(onMounted|onUnmounted|onBeforeMount|onBeforeUnmount|onUpdated|watch|watchEffect)\s*\(\s*function\s+[A-Za-z_$][\w$]*\s*\([^)]*\)\s*(?::\s*[^{}]+)?\s*\{/g;

  for (const hookMatch of content.matchAll(hookNamedFunctionPattern)) {
    const hookName = hookMatch[1];
    const hookOffset = hookMatch.index ?? 0;
    const lineNumber = getLineNumberByOffset(content, hookOffset);
    pushFinding(
      'style/hooks-named-function',
      filePath,
      `Line ${lineNumber}: use arrow function in ${hookName} callback instead of named function`,
    );
  }

  // defineProps/defineEmits blank line check: после defineEmits должна быть пустая строка перед state/computed
  for (let index = 1; index < lines.length; index += 1) {
    const currentTrimmedLine = lines[index].trim();
    // Проверяем, что текущая строка - это state или computed после emits
    if (/^const\s+[A-Za-z_$][\w$]*\s*=\s*(?:ref|reactive|computed)\(/.test(currentTrimmedLine)) {
      const previousTrimmedLine = lines[index - 1].trim();
      // Предыдущая строка - это defineEmits или конец блока emits
      if (previousTrimmedLine.includes('defineEmits') || previousTrimmedLine === ');') {
        pushFinding(
          'style/blank-line-after-emits',
          filePath,
          `Line ${index + 1}: add an empty line after defineEmits block before state/computed`,
        );
      }
    }
  }

  // Store declaration blank line check: после use*Store() должна быть пустая строка
  for (let index = 1; index < lines.length; index += 1) {
    const currentTrimmedLine = lines[index].trim();
    if (/^const\s+[A-Za-z_$][\w$]*\s*=\s*ref\(/.test(currentTrimmedLine) ||
        /^const\s+[A-Za-z_$][\w$]*\s*=\s*reactive\(/.test(currentTrimmedLine)) {
      const previousTrimmedLine = lines[index - 1].trim();
      if (/use\w+Store\(/.test(previousTrimmedLine)) {
        pushFinding(
          'style/blank-line-between-store-and-state',
          filePath,
          `Line ${index + 1}: keep an empty line between use*Store() and ref/reactive declarations`,
        );
      }
    }
  }

  // async tail await return pattern
  const asyncFunctionTailAwaitPattern =
    /^([ \t]*)(export\s+)?async function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*(:\s*Promise<[^>\n]+>)?\s*\{\n\1  await\s+([^\n;]+);\n\1\}/gm;

  for (const asyncFunctionMatch of content.matchAll(asyncFunctionTailAwaitPattern)) {
    const matchOffset = asyncFunctionMatch.index ?? 0;
    const lineNumber = getLineNumberByOffset(content, matchOffset);
    pushFinding(
      'style/async-tail-await-return',
      filePath,
      `Line ${lineNumber}: replace tail await with explicit return and remove redundant async modifier`,
    );
  }

  const asyncArrowTailAwaitPattern =
    /^([ \t]*)(export\s+)?const\s+([A-Za-z_$][\w$]*\s*=\s*async\s*\([^)]*\)\s*(:\s*Promise<[^>\n]+>)?\s*=>\s*\{\n\1  await\s+([^\n;]+);\n\1\};)/gm;

  for (const asyncArrowMatch of content.matchAll(asyncArrowTailAwaitPattern)) {
    const matchOffset = asyncArrowMatch.index ?? 0;
    const lineNumber = getLineNumberByOffset(content, matchOffset);
    pushFinding(
      'style/async-tail-await-return',
      filePath,
      `Line ${lineNumber}: replace tail await with explicit return and remove redundant async modifier`,
    );
  }

  // Inline object function params
  const functionInlineObjectParamPattern =
    /(?:export\s+)?(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(\s*[A-Za-z_$][\w$]*\s*:\s*\{[\s\S]*?\}\s*\)/g;
  for (const functionMatch of content.matchAll(functionInlineObjectParamPattern)) {
    const functionOffset = functionMatch.index ?? 0;
    const lineNumber = getLineNumberByOffset(content, functionOffset);
    pushFinding(
      'typing/no-inline-object-function-params',
      filePath,
      `Line ${lineNumber}: inline object type in function parameter is forbidden; move it to *.types.ts/types.ts`,
    );
  }

  const arrowInlineObjectParamPattern =
    /(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::\s*[^=]+)?=\s*(?:async\s*)?\(\s*[A-Za-z_$][\w$]*\s*:\s*\{[\s\S]*?\}\s*\)\s*(?::\s*[^=]+)?\s*=>/g;
  for (const arrowMatch of content.matchAll(arrowInlineObjectParamPattern)) {
    const arrowOffset = arrowMatch.index ?? 0;
    const lineNumber = getLineNumberByOffset(content, arrowOffset);
    pushFinding(
      'typing/no-inline-object-function-params',
      filePath,
      `Line ${lineNumber}: inline object type in function parameter is forbidden; move it to *.types.ts/types.ts`,
    );
  }

  const functionExpressionInlineObjectParamPattern =
    /(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::\s*[^=]+)?=\s*(?:async\s*)?function\s*\(\s*[A-Za-z_$][\w$]*\s*:\s*\{[\s\S]*?\}\s*\)/g;
  for (const functionExpressionMatch of content.matchAll(functionExpressionInlineObjectParamPattern)) {
    const functionExpressionOffset = functionExpressionMatch.index ?? 0;
    const lineNumber = getLineNumberByOffset(content, functionExpressionOffset);
    pushFinding(
      'typing/no-inline-object-function-params',
      filePath,
      `Line ${lineNumber}: inline object type in function parameter is forbidden; move it to *.types.ts/types.ts`,
    );
  }

  // Function params inline small arity
  const multilineSmallArityFunctionPattern = /(export\s+)?(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(([\s\S]*?)\)\s*(?::\s*[\s\S]*?)?\s*\{/g;
  for (const functionMatch of content.matchAll(multilineSmallArityFunctionPattern)) {
    const [, , paramsTextRaw] = functionMatch;
    const paramsText = paramsTextRaw ?? '';
    if (!paramsText.includes('\n')) {
      continue;
    }

    const paramsCount = countTopLevelFunctionParams(paramsText.trim());
    if (paramsCount === 0 || paramsCount > 2) {
      continue;
    }

    const functionOffset = functionMatch.index ?? 0;
    const lineNumber = getLineNumberByOffset(content, functionOffset);
    pushFinding(
      'style/function-params-inline-small-arity',
      filePath,
      `Line ${lineNumber}: keep function params on one line for functions with 1-2 params`,
    );
  }

  const multilineSmallArityArrowPattern =
    /(export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::\s*[\s\S]*?)?=\s*(?:async\s*)?\(([\s\S]*?)\)\s*(?::\s*[\s\S]*?)?\s*=>/g;
  for (const arrowMatch of content.matchAll(multilineSmallArityArrowPattern)) {
    const [, , paramsTextRaw] = arrowMatch;
    const paramsText = paramsTextRaw ?? '';
    if (!paramsText.includes('\n')) {
      continue;
    }

    const paramsCount = countTopLevelFunctionParams(paramsText.trim());
    if (paramsCount === 0 || paramsCount > 2) {
      continue;
    }

    const arrowOffset = arrowMatch.index ?? 0;
    const lineNumber = getLineNumberByOffset(content, arrowOffset);
    pushFinding(
      'style/function-params-inline-small-arity',
      filePath,
      `Line ${lineNumber}: keep function params on one line for functions with 1-2 params`,
    );
  }

  // Exported function TSDoc
  for (let index = 0; index < lines.length; index += 1) {
    const trimmedLine = lines[index].trim();
    const isExportedFunctionDeclaration = /^export\s+(async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(/.test(trimmedLine);
    const isExportedArrowFunction =
      /^export\s+const\s+[A-Za-z_$][\w$]*\s*=\s*(async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/.test(trimmedLine);
    const isExportedFunctionExpression =
      /^export\s+const\s+[A-Za-z_$][\w$]*\s*=\s*(async\s*)?function\b/.test(trimmedLine);

    if (!isExportedFunctionDeclaration && !isExportedArrowFunction && !isExportedFunctionExpression) {
      continue;
    }

    const tsDocBlock = getTsDocBeforeLine(lines, index);
    if (!tsDocBlock) {
      pushFinding(
        'style/exported-function-tsdoc',
        filePath,
        `Line ${index + 1}: add TSDoc comment (/** ... */) before exported function`,
      );
      continue;
    }

    const hasDescriptionTag = /@description\s+/.test(tsDocBlock);
    const hasReturnTagWithType = /@return\s*\{\s*[^}]+\s*\}\s+/.test(tsDocBlock);

    if (!hasDescriptionTag || !hasReturnTagWithType) {
      pushFinding(
        'style/exported-function-tsdoc-format',
        filePath,
        `Line ${index + 1}: use TSDoc format with @description and @return { Type }`,
      );
    }
  }

  // Vue template checks: v-if вместо &&, v-for с :key
  // Проверяем, что в <template> нет pattern'а {condition && <Component>} (React-style conditional rendering)
  const templateStartPattern = /^<template>/;
  const templateEndPattern = /^<\/template>/;
  let inTemplate = false;

  for (let index = 0; index < lines.length; index += 1) {
    const trimmedLine = lines[index].trim();

    if (templateStartPattern.test(trimmedLine)) {
      inTemplate = true;
      continue;
    }

    if (templateEndPattern.test(trimmedLine)) {
      inTemplate = false;
      continue;
    }

    if (!inTemplate) {
      continue;
    }

    // Проверяем React-style conditional rendering: {condition && <Component>}
    if (/\{[^}]*&&\s*</.test(trimmedLine)) {
      pushFinding(
        'style/vue-prefer-v-if',
        filePath,
        `Line ${index + 1}: use v-if="condition" instead of {condition && <Component>} in Vue templates`,
      );
    }

    // Проверяем v-for без :key
    if (/v-for\s*=/.test(trimmedLine) && !/:key\s*=/.test(trimmedLine)) {
      pushFinding(
        'style/v-for-requires-key',
        filePath,
        `Line ${index + 1}: v-for must have :key binding`,
      );
    }
  }

  runVueScriptBlockOrderHeuristics({ filePath, lines });
  runPiniaStoreGroupSeparationHeuristics({ filePath, lines });
}

// Запускает ESLint через `node node_modules/eslint/bin/eslint.js`, чтобы не зависеть от `.bin` шимов Windows (ENOENT/EINVAL).
function runEslintAudit() {
  const eslintCli = resolve(repoRoot, 'node_modules/eslint/bin/eslint.js');
  if (!existsSync(eslintCli)) {
    pushFinding('tooling/eslint-missing', resolve(repoRoot, 'package.json'), 'eslint binary is not installed');
    return;
  }

  const eslintResult = spawnSync(process.execPath, [eslintCli, inputTarget], {
    cwd: repoRoot,
    encoding: 'utf-8',
  });

  if (eslintResult.status !== 0) {
    const output = `${eslintResult.stdout ?? ''}\n${eslintResult.stderr ?? ''}`.trim();
    pushFinding('eslint', targetPath, output || 'eslint reported issues');
  }
}

// Применяет набор regex-эвристик поверх файлов проекта и ищет нарушения локальных правил без запуска линтера.
function runRuleHeuristics() {
  const filePaths = [];
  walkDirectory(targetPath, (filePath) => filePaths.push(filePath));

  for (const filePath of filePaths) {
    if (!/\.(ts|vue|scss)$/.test(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, 'utf-8');

    if (filePath.endsWith('.scss')) {
      const normalizedPath = filePath.split(sep).join('/');
      if (normalizedPath.includes('/src/') && !normalizedPath.endsWith('/src/assets/styles/global.scss')) {
        pushFinding('styles/global-scss-location', filePath, 'Global styles should live only in src/assets/styles/global.scss');
      }

      if (/@import\s+['"]/.test(content)) {
        pushFinding('styles/sass-import', filePath, 'Use @use/@forward instead of @import');
      }
    }

    if (/\.(ts|vue)$/.test(filePath)) {
      const lines = content.split(/\r?\n/);

      lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        const previousLine = index > 0 ? lines[index - 1] : '';
        const previousTrimmedLine = previousLine.trim();

        if (/^\s*if\s*\(/.test(line) && /^(const|let|var)\b/.test(previousTrimmedLine) && previousTrimmedLine.length > 0) {
          pushFinding(
            'style/blank-line-before-if',
            filePath,
            `Line ${index + 1}: add a blank line between variable declarations and if-statement`,
          );
        }

        if (/^\s*if\s*\(.*\)\s*\{\s*$/.test(trimmedLine) && index + 2 < lines.length) {
          const nextTrimmedLine = lines[index + 1].trim();
          const closingTrimmedLine = lines[index + 2].trim();
          const returnMatch = nextTrimmedLine.match(/^return(?:\s+(.*?))?;\s*$/);
          if (returnMatch && isSimpleGuardReturnExpression(returnMatch[1] ?? '') && closingTrimmedLine === '}') {
            pushFinding(
              'style/if-guard-one-line-return',
              filePath,
              `Line ${index + 1}: use single-line guard format "if (condition) return ...;" for simple returns`,
            );
          }
        }

        const oneLineGuardReturnMatch = trimmedLine.match(/^if\s*\((.+)\)\s+return(?:\s+(.*?))?;\s*$/);
        if (oneLineGuardReturnMatch) {
          const returnExpression = oneLineGuardReturnMatch[2] ?? '';
          if (!isSimpleGuardReturnExpression(returnExpression)) {
            pushFinding(
              'style/if-guard-complex-return-multiline',
              filePath,
              `Line ${index + 1}: keep complex return in multiline if-block, not one-line guard`,
            );
          }
        }
      });

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const trimmedLine = line.trim();

        if (/^\s*const\s+[^=]+=\s*(?:[A-Za-z_$][\w$.\]?]*|\([^)]*\))\.(map|filter|forEach|find|reduce)\(.*\);\s*$/.test(trimmedLine)) {
          pushFinding(
            'style/chain-ladder-format',
            filePath,
            `Line ${index + 1}: expand .map/.filter/... call into ladder multiline format`,
          );
        }

        if (/^\s*const\s+[^=]+=\s*(?:[A-Za-z_$][\w$.\]?]*|\([^)]*\))\.(map|filter|forEach|find|reduce)\(\s*\(/.test(trimmedLine)) {
          pushFinding(
            'style/chain-callback-newline',
            filePath,
            `Line ${index + 1}: start callback arguments on a new line after value.method(`,
          );
        }

        if (index < lines.length - 1) {
          const nextTrimmedLine = lines[index + 1].trim();
          if (/^\s*\),\s*$/.test(trimmedLine) && /^\s*\);\s*$/.test(nextTrimmedLine)) {
            pushFinding(
              'style/chain-closing-same-line',
              filePath,
              `Line ${index + 1}: keep callback and method closing brackets on one line as "));"`,
            );
          }
        }

        if (index < lines.length - 1) {
          const nextTrimmedLine = lines[index + 1].trim();
          const hasMethodOnCurrentLine =
            /^\s*const\s+[^=]+=\s*(?:[A-Za-z_$][\w$.\]?]*|\([^)]*\))\.(map|filter|forEach|find|reduce)\(.*$/.test(trimmedLine);
          const nextStartsWithMethod = /^\.\s*(map|filter|forEach|find|reduce)\s*\(/.test(nextTrimmedLine);

          if (hasMethodOnCurrentLine && nextStartsWithMethod) {
            pushFinding(
              'style/chain-first-method-newline',
              filePath,
              `Line ${index + 1}: for multi-method chains, move the first method to a new line`,
            );
          }

          if (
            /\s=\s*.+$/.test(trimmedLine) &&
            hasChainReceiverAtLineEnd(trimmedLine.split('=').slice(1).join('=')) &&
            nextStartsWithMethod
          ) {
            let chainCount = 0;
            let scanIndex = index + 1;
            while (scanIndex < lines.length) {
              const scanTrimmed = lines[scanIndex].trim();
              if (/^\.\s*(map|filter|forEach|find|reduce)\s*\(/.test(scanTrimmed)) {
                chainCount += 1;
                scanIndex += 1;
                continue;
              }
              if (scanTrimmed === '' || /^[).,;{}]/.test(scanTrimmed)) {
                scanIndex += 1;
                continue;
              }
              break;
            }

            if (chainCount !== 1) {
              continue;
            }

            pushFinding(
              'style/chain-method-same-line',
              filePath,
              `Line ${index + 1}: keep value and single method call on same line (value.method()...)`,
            );
          }
        }
      }

      const hasLocalTypeDeclaration = /^\s*(?:export\s+)?(?:type|interface)\s+[A-Z]\w*/m.test(content);

      if (!/(\.types\.ts|[\\/]types\.ts)$/.test(filePath) && hasLocalTypeDeclaration) {
        pushFinding('typing/types-location', filePath, 'Move type/interface declarations to *.types.ts or types.ts');
      }

      // Variable type annotation check (только для .ts файлов, не .vue)
      if (filePath.endsWith('.ts')) {
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // Skip declarations where explicit annotation is not applicable or ambiguous for regex heuristic.
          if (!/^(const|let|var)\s+/.test(trimmedLine)) {
            return;
          }
          if (trimmedLine.startsWith('const {') || trimmedLine.startsWith('let {') || trimmedLine.startsWith('var {')) {
            return;
          }
          if (trimmedLine.startsWith('const [') || trimmedLine.startsWith('let [') || trimmedLine.startsWith('var [')) {
            return;
          }
          if (!trimmedLine.includes('=')) {
            return;
          }
          const hasVariableAnnotation = /^(const|let|var)\s+[A-Za-z_$][\w$]*\s*:/.test(trimmedLine);
          const hasInlineObjectVariableAnnotation = /^(const|let|var)\s+[A-Za-z_$][\w$]*\s*:\s*\{/.test(trimmedLine);
          const isFunctionAssignment =
            /=\s*(async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?\s*=>/.test(trimmedLine) || /=\s*(async\s*)?function\b/.test(trimmedLine);
          const hasInlineFunctionParamsAnnotation =
            /=\s*(async\s*)?\([^)]*:\s*[^)]*\)\s*(?::\s*[^=]+)?\s*=>/.test(trimmedLine) ||
            /=\s*(async\s*)?function\s*\([^)]*:\s*[^)]*\)\s*(?::\s*[^{=]+)?/.test(trimmedLine);
          const hasInlineFunctionReturnAnnotation =
            /=\s*(async\s*)?\([^)]*\)\s*:\s*[^=]+\s*=>/.test(trimmedLine) ||
            /=\s*(async\s*)?function\s*\([^)]*\)\s*:\s*[^{=]+/.test(trimmedLine);
          const hasInlineFunctionAnnotation = hasInlineFunctionParamsAnnotation || hasInlineFunctionReturnAnnotation;
          const isFunctionCallInitializer = /=\s*(new\s+)?[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\s*\(/.test(trimmedLine);
          const isHookCallInitializer = /=\s*use[A-Z][A-Za-z0-9_]*(?:\s*<[^>]+>)?\s*\(/.test(trimmedLine);
          const variableAnnotationMatch = trimmedLine.match(/^(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*:\s*([^=]+?)\s*=/);
          const variableAnnotationRaw = variableAnnotationMatch?.[1]?.trim() ?? '';
          const normalizedVariableAnnotation = variableAnnotationRaw.replace(/\s+/g, '');
          const isScalarHookAnnotation = /^(string|number|boolean)(\|(string|number|boolean))*$/.test(normalizedVariableAnnotation);

          if (hasInlineObjectVariableAnnotation) {
            pushFinding(
              'typing/no-inline-object-variable-type',
              filePath,
              `Line ${index + 1}: inline object type in variable annotation is forbidden; use named type`,
            );
            return;
          }

          if (isFunctionAssignment && hasVariableAnnotation && hasInlineFunctionAnnotation) {
            pushFinding(
              'typing/duplicate-function-typing',
              filePath,
              `Line ${index + 1}: avoid duplicate function typing on both variable and implementation`,
            );
            return;
          }

          if (/^(const|let|var)\s+[A-Za-z_$][\w$]*\s*:\s*ReturnType\s*<\s*typeof\b/.test(trimmedLine)) {
            pushFinding(
              'typing/no-returntype-typeof-variable',
              filePath,
              `Line ${index + 1}: avoid ReturnType<typeof ...> in variable annotations; use direct named types`,
            );
            return;
          }

          const hasHookGenericOnRight = /=\s*use[A-Z][A-Za-z0-9_]*\s*<[^>]+>\s*\(/.test(trimmedLine);

          if (hasVariableAnnotation && isHookCallInitializer && hasHookGenericOnRight && !isScalarHookAnnotation) {
            pushFinding(
              'typing/no-duplicate-hook-generic-typing',
              filePath,
              `Line ${index + 1}: avoid duplicate typing for hooks; keep type on variable left side and remove generic from hook call`,
            );
            return;
          }

          if (hasVariableAnnotation) {
            return;
          }
          if (isFunctionAssignment && hasInlineFunctionAnnotation) {
            return;
          }
          if (isFunctionCallInitializer) {
            return;
          }

          pushFinding(
            'typing/explicit-variable-annotation',
            filePath,
            `Line ${index + 1}: local variable should have an explicit type annotation`,
          );
        });
      }

      runAdditionalStyleHeuristics({
        content,
        filePath,
        lines,
      });
    }
  }
}

// Печатает итоговый отчет по найденным нарушениям, сгруппированный по имени правила.
function printReport() {
  console.log(`Rules audit target: ${inputTarget}`);
  console.log('');

  if (!findings.length) {
    console.log('No rule violations found by configured checks.');
    return;
  }

  const groupedFindings = findings.reduce((accumulator, finding) => {
    const current = accumulator.get(finding.rule) ?? [];
    current.push(finding);
    accumulator.set(finding.rule, current);
    return accumulator;
  }, new Map());

  for (const [rule, ruleFindings] of groupedFindings) {
    console.log(`- ${rule}: ${ruleFindings.length}`);
    for (const finding of ruleFindings) {
      console.log(`  - ${finding.filePath}`);
      console.log(`    ${finding.details.replace(/\n/g, '\n    ')}`);
    }
    console.log('');
  }
}

runEslintAudit();
runRuleHeuristics();
printReport();

process.exit(findings.length ? 1 : 0);
