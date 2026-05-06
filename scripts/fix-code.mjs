import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const inputTargetRaw = process.argv[2] ?? 'src';
const inputTarget = inputTargetRaw.replace(/\\/g, '/');
const targetPath = resolve(repoRoot, inputTargetRaw);
const maxFixPassesPerFile = 5;
const skippedDirectoryNames = new Set(['node_modules', '.nuxt', '.output', '.git']);
const chainMethodsPattern = 'map|filter|forEach|find|reduce';
const chainMethodStartPattern = new RegExp(`^\\.\\s*(?:${chainMethodsPattern})\\s*\\(`);
const chainSingleLinePattern = new RegExp(
  `^(\\s*const\\s+[^=]+=\\s*)((?:[A-Za-z_$][\\w$.\\]?]*|\\([^)]*\\)))\\.(${chainMethodsPattern})\\((.*)\\);\\s*$`,
);
const chainCurrentLinePattern = new RegExp(
  `^(\\s*const\\s+[^=]+=\\s*)((?:[A-Za-z_$][\\w$.\\]?]*|\\([^)]*\\)))\\.(${chainMethodsPattern})\\((.*)$`,
);
const chainCallbackInlinePattern = new RegExp(
  `^(\\s*const\\s+[^=]+=\\s*[A-Za-z_$][\\w$.]*\\.(?:${chainMethodsPattern})\\()\\s*(\\([^)]*\\)\\s*=>\\s*.*)$`,
);

if (!existsSync(targetPath)) {
  console.error(`Target does not exist: ${inputTarget}`);
  process.exit(2);
}

const updatedFiles = [];
let totalFixes = 0;

// Рекурсивно обходит целевую директорию и собирает все файлы, пропуская служебные папки.
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

// Проверяет, заканчивается ли выражение слева корректным получателем для цепочки вызовов `.map()/.filter()` и т.д.
function hasChainReceiverAtLineEnd(value) {
  return /(?:[A-Za-z_$][\w$.\]?]*|\([^)]*\))$/.test(value.trim());
}

// Проверяет, начинается ли строка с очередного метода в chain-вызове.
function startsWithChainMethod(value) {
  return chainMethodStartPattern.test(value.trim());
}

// Определяет, можно ли оставить guard-return в однострочном виде по правилам проекта.
function isSimpleGuardReturnExpression(value) {
  const normalizedValue = value.trim();

  return (
    normalizedValue === '' ||
    /^(?:''|""|null|undefined|true|false|0|1)$/.test(normalizedValue) ||
    /^[A-Za-z_$][\w$]*$/.test(normalizedValue) ||
    /^[A-Za-z_$][\w$]*\(\s*[A-Za-z_$][\w$]*\s*\)$/.test(normalizedValue)
  );
}

// Убирает дублирующую типизацию у function-valued переменных, оставляя сигнатуру только в реализации.
function fixDuplicateFunctionTyping(content) {
  let fixedContent = content;
  let fixesCount = 0;

  const arrowPattern = /(const|let|var)\s+([A-Za-z_$][\w$]*)\s*:\s*(.+?)\s*=\s*(async\s*)?\(([^)]*)\)\s*(?::\s*([^=]+?))?\s*=>/g;

  fixedContent = fixedContent.replace(
    arrowPattern,
    (fullMatch, declarationKind, variableName, _leftType, asyncPrefix = '', params, returnType) => {
      const hasInlineParamsType = params.includes(':');
      const hasInlineReturnType = Boolean(returnType && returnType.trim());

      if (!hasInlineParamsType && !hasInlineReturnType) {
        return fullMatch;
      }

      fixesCount += 1;
      const returnTypeSegment = returnType ? `: ${returnType.trim()} ` : ' ';

      return `${declarationKind} ${variableName} = ${asyncPrefix}(${params})${returnTypeSegment}=>`;
    },
  );

  const functionPattern =
    /(const|let|var)\s+([A-Za-z_$][\w$]*)\s*:\s*(.+?)\s*=\s*(async\s*)?function\s*\(([^)]*)\)\s*(?::\s*([^{=]+?))?\s*\{/g;
  fixedContent = fixedContent.replace(
    functionPattern,
    (fullMatch, declarationKind, variableName, _leftType, asyncPrefix = '', params, returnType) => {
      const hasInlineParamsType = params.includes(':');
      const hasInlineReturnType = Boolean(returnType && returnType.trim());

      if (!hasInlineParamsType && !hasInlineReturnType) {
        return fullMatch;
      }

      fixesCount += 1;
      const returnTypeSegment = returnType ? `: ${returnType.trim()} ` : ' ';

      return `${declarationKind} ${variableName} = ${asyncPrefix}function(${params}) ${returnTypeSegment}{`;
    },
  );

  return { fixedContent, fixesCount };
}

// Удаляет дублирующий generic у hook/composable-вызова, если тип уже указан слева у переменной.
// Работает как для React hooks (use*), так и для Vue composables (use*).
function fixDuplicateHookGenericTyping(content) {
  let fixedContent = content;
  let fixesCount = 0;

  const hookPattern = /((?:const|let|var)\s+[A-Za-z_$][\w$]*\s*:\s*[^=\n]+=\s*)((?:React\.)?)(use[A-Z][A-Za-z0-9_]*)\s*<[^>\n]+>\s*\(/g;

  fixedContent = fixedContent.replace(hookPattern, (fullMatch, leftSide, hookNamespace, hookName) => {
    fixesCount += 1;

    return `${leftSide}${hookNamespace}${hookName}(`;
  });

  return { fixedContent, fixesCount };
}

// Приводит цепочки `.map()/.filter()/.reduce()` к форматированию "лесенкой" и нормализует закрывающие скобки.
function fixSingleChainLadder(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  for (let index = 0; index < lines.length - 1; index += 1) {
    const currentLine = lines[index];
    const nextLine = lines[index + 1];
    const nextTrimmed = nextLine.trim();

    const currentMatch = currentLine.match(chainCurrentLinePattern);
    const nextStartsWithMethod = startsWithChainMethod(nextTrimmed);

    if (!currentMatch || !nextStartsWithMethod) {
      continue;
    }

    const [, leftPart, receiver, methodName, methodArgsTail] = currentMatch;
    const indentMatch = currentLine.match(/^(\s*)/);
    const indent = indentMatch?.[1] ?? '';
    const chainIndent = `${indent}  `;

    lines[index] = `${leftPart}${receiver}`;
    lines.splice(index + 1, 0, `${chainIndent}.${methodName}(${methodArgsTail.trim()}`);
    fixesCount += 1;
    index += 1;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    const match = currentLine.match(chainCallbackInlinePattern);

    if (!match) {
      continue;
    }

    const [, callStart, callbackStart] = match;
    const indentMatch = currentLine.match(/^(\s*)/);
    const indent = indentMatch?.[1] ?? '';
    const innerIndent = `${indent}  `;

    lines[index] = callStart;
    lines.splice(index + 1, 0, `${innerIndent}${callbackStart.trim()}`);
    fixesCount += 1;
    index += 1;
  }

  for (let index = 0; index < lines.length - 1; index += 1) {
    const currentLine = lines[index];
    const nextLine = lines[index + 1];
    const currentTrimmed = currentLine.trim();
    const nextTrimmed = nextLine.trim();

    if (!/\s=\s*.+$/.test(currentTrimmed)) {
      continue;
    }

    const rightSide = currentTrimmed.split('=').slice(1).join('=');

    if (!hasChainReceiverAtLineEnd(rightSide)) {
      continue;
    }

    if (!startsWithChainMethod(nextTrimmed)) {
      continue;
    }

    let chainCount = 0;
    let scanIndex = index + 1;

    while (scanIndex < lines.length) {
      const scanTrimmed = lines[scanIndex].trim();

      if (startsWithChainMethod(scanTrimmed)) {
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

    lines[index] = `${currentLine}${nextTrimmed}`;
    lines.splice(index + 1, 1);

    for (let shiftIndex = index + 1; shiftIndex < lines.length; shiftIndex += 1) {
      const shiftedLine = lines[shiftIndex];

      if (/^\s*\);\s*$/.test(shiftedLine)) {
        if (shiftedLine.startsWith('  ')) {
          lines[shiftIndex] = shiftedLine.slice(2);
        }

        break;
      }

      if (shiftedLine.startsWith('  ')) {
        lines[shiftIndex] = shiftedLine.slice(2);
      }
    }

    fixesCount += 1;
    index = Math.max(-1, index - 1);
  }

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    const match = currentLine.match(chainSingleLinePattern);

    if (!match) {
      continue;
    }

    const [, leftPart, collectionExpr, methodName, argsRaw] = match;
    const indentMatch = currentLine.match(/^(\s*)/);
    const indent = indentMatch?.[1] ?? '';
    const innerIndent = `${indent}  `;
    const callbackMatch = argsRaw.trim().match(/^(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*(.+)$/);

    const nextLines = [];
    nextLines.push(`${leftPart}${collectionExpr}.${methodName}(`);

    if (callbackMatch) {
      const [, callbackParams, callbackBodyRaw] = callbackMatch;
      const callbackBody = callbackBodyRaw.replace(/,\s*$/, '').trim();
      nextLines.push(`${innerIndent}${callbackParams} => (`);
      nextLines.push(`${innerIndent}  ${callbackBody}`);
      nextLines.push(`${innerIndent}),`);
    } else {
      nextLines.push(`${innerIndent}${argsRaw.trim()},`);
    }

    nextLines.push(`${indent});`);

    lines.splice(index, 1, ...nextLines);
    fixesCount += 1;
    index += nextLines.length - 1;
  }

  // Нормализует закрывающую иерархию в однострочный вид:
  //      ),
  //    );
  // =>
  //      ));
  for (let index = 0; index < lines.length - 1; index += 1) {
    const currentLine = lines[index];
    const nextLine = lines[index + 1];

    if (!/^\s*\),\s*$/.test(currentLine) || !/^\s*\);\s*$/.test(nextLine)) {
      continue;
    }

    const indentMatch = currentLine.match(/^(\s*)/);
    const innerIndent = indentMatch?.[1] ?? '';
    lines.splice(index, 2, `${innerIndent}));`);
    fixesCount += 1;
  }

  return { fixedContent: lines.join('\n'), fixesCount };
}

// Переводит guard-ветки между однострочным и многострочным видом в зависимости от сложности `return`.
function fixSimpleGuardIfReturn(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    const oneLineMatch = currentLine.match(/^(\s*)if\s*\((.+)\)\s+return(?:\s+(.*?))?;\s*$/);

    if (!oneLineMatch) {
      continue;
    }

    const [, indent, condition, returnValue = ''] = oneLineMatch;

    if (isSimpleGuardReturnExpression(returnValue)) {
      continue;
    }

    const returnStatement = returnValue ? `return ${returnValue};` : 'return;';

    lines.splice(index, 1, `${indent}if (${condition}) {`, `${indent}  ${returnStatement}`, `${indent}}`);
    fixesCount += 1;
    index += 2;
  }

  for (let index = 0; index < lines.length - 2; index += 1) {
    const ifLine = lines[index];
    const returnLine = lines[index + 1];
    const closingLine = lines[index + 2];

    const ifMatch = ifLine.match(/^(\s*)if\s*\((.+)\)\s*\{\s*$/);

    if (!ifMatch) {
      continue;
    }

    const returnMatch = returnLine.match(/^\s*return(?:\s+(.*?))?;\s*$/);

    if (!returnMatch) {
      continue;
    }

    if (closingLine.trim() !== '}') {
      continue;
    }

    const [, indent, condition] = ifMatch;
    const returnValue = returnMatch[1];
    const normalizedReturn = returnValue ? `return ${returnValue};` : 'return;';

    if (!isSimpleGuardReturnExpression(returnValue ?? '')) {
      continue;
    }

    lines.splice(index, 3, `${indent}if (${condition}) ${normalizedReturn}`);
    fixesCount += 1;
  }

  return { fixedContent: lines.join('\n'), fixesCount };
}

// Убирает `void` у fire-and-forget вызовов:
// void someAsyncCall();
// =>
// someAsyncCall();
function fixVoidFireAndForgetCalls(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index];
    const match = currentLine.match(/^(\s*)void\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\s*\([^;]*\)\s*;)\s*$/);

    if (!match) {
      continue;
    }

    const [, indent, callExpression] = match;
    lines[index] = `${indent}${callExpression}`;
    fixesCount += 1;
  }

  return { fixedContent: lines.join('\n'), fixesCount };
}

// Добавляет пустую строку между двумя последовательными if-блоками.
function fixBlankLineBetweenConsecutiveIf(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  for (let index = 1; index < lines.length; index += 1) {
    const currentTrimmed = lines[index].trim();
    const previousTrimmed = lines[index - 1].trim();

    if (!/^if\s*\(/.test(currentTrimmed) || !/^if\s*\(/.test(previousTrimmed)) {
      continue;
    }

    lines.splice(index, 0, '');
    fixesCount += 1;
    index += 1;
  }

  return { fixedContent: lines.join('\n'), fixesCount };
}

// Добавляет пустую строку перед return, если перед ним есть другие выражения.
function fixBlankLineBeforeReturn(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  for (let index = 1; index < lines.length; index += 1) {
    const currentTrimmed = lines[index].trim();
    const previousTrimmed = lines[index - 1].trim();

    if (!/^return\b/.test(currentTrimmed)) {
      continue;
    }

    if (!previousTrimmed || previousTrimmed.endsWith('{')) {
      continue;
    }

    lines.splice(index, 0, '');
    fixesCount += 1;
    index += 1;
  }

  return { fixedContent: lines.join('\n'), fixesCount };
}

// Схлопывает 2+ пустых строк перед if до ровно одной.
function fixCollapseExtraBlankLinesBeforeIf(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  // Обходим с конца, чтобы корректно удалять строки без смещения индексов.
  for (let index = lines.length - 1; index >= 1; index -= 1) {
    const currentTrimmed = lines[index].trim();

    if (!/^if\s*\(/.test(currentTrimmed)) {
      continue;
    }

    let blankCount = 0;
    let scanIdx = index - 1;
    while (scanIdx >= 0 && lines[scanIdx].trim() === '') {
      blankCount += 1;
      scanIdx -= 1;
    }

    if (blankCount >= 2) {
      const removeCount = blankCount - 1;
      // Удаляем лишние пустые строки, оставляя ровно одну (scanIdx + 1).
      lines.splice(scanIdx + 2, removeCount);
      fixesCount += removeCount;
    }
  }

  return { fixedContent: lines.join('\n'), fixesCount };
}

// Добавляет пустую строку между объявлением переменной и следующим if.
function fixBlankLineBeforeIf(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  for (let index = 1; index < lines.length; index += 1) {
    const currentTrimmed = lines[index].trim();
    const previousTrimmed = lines[index - 1].trim();

    if (!/^if\s*\(/.test(currentTrimmed)) {
      continue;
    }

    if (!/^(const|let|var)\b/.test(previousTrimmed)) {
      continue;
    }

    lines.splice(index, 0, '');
    fixesCount += 1;
    index += 1;
  }

  return { fixedContent: lines.join('\n'), fixesCount };
}

// Переносит однострочные `useSomeStore((state) => state.value)` в многострочный формат,
// ожидаемый проектными правилами для Pinia-сторов.
function fixPiniaStoreSelectorFormatting(content) {
  let fixedContent = content;
  let fixesCount = 0;

  const oneLineSelectorPattern =
    /^([ \t]*)(const|let|var)\s+([A-Za-z_$][\w$]*)\s*:\s*([^=]+?)\s*=\s*(use[A-Z][A-Za-z0-9_]*)\(\s*\(([^)\n]+)\)\s*=>\s*([^\n;]+)\s*\);\s*$/gm;

  fixedContent = fixedContent.replace(
    oneLineSelectorPattern,
    (_fullMatch, indent, declarationKind, variableName, variableType, storeName, selectorParams, selectorExpression) => {
      fixesCount += 1;
      const normalizedVariableType = variableType.trim();
      const normalizedSelectorParams = selectorParams.trim();
      const normalizedSelectorExpression = selectorExpression.trim().replace(/,\s*$/, '');

      return `${indent}${declarationKind} ${variableName}: ${normalizedVariableType} = ${storeName}(
${indent}  (${normalizedSelectorParams}) => ${normalizedSelectorExpression},
${indent});`;
    },
  );

  return { fixedContent, fixesCount };
}

// Обеспечивает пустую строку после блока `defineProps`/`defineEmits` в Vue SFC `<script setup>`:
// const props = defineProps<{ ... }>();
//
// const someVar = ...
function fixDefinePropsEmitsBlankLine(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  for (let index = 0; index < lines.length - 1; index += 1) {
    const currentTrimmed = lines[index].trim();

    if (!/^const\s+\w+\s*=\s*define(?:Props|Emits)/.test(currentTrimmed)) {
      continue;
    }

    // Пропускаем многострочные defineProps/defineEmits — ищем закрывающую строку
    if (!currentTrimmed.endsWith(');') && !currentTrimmed.endsWith('>()') && !currentTrimmed.endsWith(')')) {
      // Ищем закрывающую строку
      let scanIndex = index + 1;
      while (scanIndex < lines.length && !lines[scanIndex].trim().endsWith(');') && !lines[scanIndex].trim().endsWith('>()') && !lines[scanIndex].trim().endsWith(')')) {
        scanIndex += 1;
      }
      if (scanIndex < lines.length) {
        index = scanIndex;
      } else {
        continue;
      }
    }

    let scanIndex = index + 1;
    let blankLinesCount = 0;

    while (scanIndex < lines.length && lines[scanIndex].trim() === '') {
      blankLinesCount += 1;
      scanIndex += 1;
    }

    if (scanIndex >= lines.length) {
      continue;
    }

    if (blankLinesCount === 1) {
      continue;
    }

    if (blankLinesCount === 0) {
      lines.splice(index + 1, 0, '');
      fixesCount += 1;
      continue;
    }

    lines.splice(index + 2, blankLinesCount - 1);
    fixesCount += blankLinesCount - 1;
  }

  return { fixedContent: lines.join('\n'), fixesCount };
}

// Группирует объявления Pinia store в единый блок:
// const aStore = useAStore();
// const bStore = useBStore();
//
// const someVar = ...
// Без пустых строк между store-декларациями и с одной пустой строкой после всей группы.
function fixStoreDeclarationBlankLine(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  const isStoreDeclarationLine = (line) => /^const\s+\w+.*=\s*use[A-Z]\w*Store\(/.test(line.trim());

  for (let index = 0; index < lines.length; index += 1) {
    const currentTrimmed = lines[index].trim();

    if (!isStoreDeclarationLine(lines[index])) {
      continue;
    }

    // Если это многострочное объявление с селектором, ищем закрывающую строку.
    let declarationEnd = index;
    if (!currentTrimmed.endsWith(');') && !currentTrimmed.endsWith(')')) {
      let scanIndex = declarationEnd + 1;
      let depth = 1;
      while (scanIndex < lines.length && depth > 0) {
        depth += (lines[scanIndex].match(/\(/g) ?? []).length;
        depth -= (lines[scanIndex].match(/\)/g) ?? []).length;
        scanIndex += 1;
      }
      declarationEnd = scanIndex > 0 ? scanIndex - 1 : declarationEnd;
    }

    // Удаляем пустые строки между соседними store-объявлениями.
    let nextIndex = declarationEnd + 1;
    let removedBlankLines = 0;
    while (nextIndex < lines.length && lines[nextIndex].trim() === '') {
      nextIndex += 1;
      removedBlankLines += 1;
    }

    if (nextIndex < lines.length && isStoreDeclarationLine(lines[nextIndex]) && removedBlankLines > 0) {
      lines.splice(declarationEnd + 1, removedBlankLines);
      fixesCount += removedBlankLines;
      index = declarationEnd;
      continue;
    }

    // Ищем конец группы store-объявлений.
    let groupEnd = declarationEnd;
    let cursor = declarationEnd + 1;
    while (cursor < lines.length) {
      if (lines[cursor].trim() === '') {
        cursor += 1;
        continue;
      }

      if (!isStoreDeclarationLine(lines[cursor])) {
        break;
      }

      groupEnd = cursor;
      cursor += 1;
    }

    // Гарантируем ровно одну пустую строку после всей группы.
    let afterGroupIndex = groupEnd + 1;
    let blankLinesAfterGroup = 0;
    while (afterGroupIndex < lines.length && lines[afterGroupIndex].trim() === '') {
      blankLinesAfterGroup += 1;
      afterGroupIndex += 1;
    }

    if (afterGroupIndex >= lines.length) {
      index = groupEnd;
      continue;
    }

    if (blankLinesAfterGroup === 0) {
      lines.splice(groupEnd + 1, 0, '');
      fixesCount += 1;
      index = groupEnd + 1;
      continue;
    }

    if (blankLinesAfterGroup > 1) {
      lines.splice(groupEnd + 2, blankLinesAfterGroup - 1);
      fixesCount += blankLinesAfterGroup - 1;
    }

    index = groupEnd;
  }

  return { fixedContent: lines.join('\n'), fixesCount };
}

// Преобразует именованные функции в стрелочные внутри Vue lifecycle hooks (onMounted, onUnmounted и т.п.)
// и watch-вызовов:
// onMounted(function handler() { ... })
// =>
// onMounted(() => { ... })
function fixVueLifecycleNamedFunction(content) {
  let fixedContent = content;
  let fixesCount = 0;

  const vueLifecycleHooks = 'onMounted|onUnmounted|onBeforeMount|onBeforeUnmount|onUpdated|onBeforeUpdate|onActivated|onDeactivated|onErrorCaptured|onRenderTracked|onRenderTriggered';
  const watchFunctions = 'watch|watchEffect|watchSyncEffect';
  const combinedPattern = `(?:${vueLifecycleHooks}|${watchFunctions})`;

  const hookNamedFunctionPattern = new RegExp(
    `(\\b(${combinedPattern})\\(\\s*)function\\s+[A-Za-z_$][\\w$]*\\s*\\(([^)]*)\\)\\s*(:\\s*[^{}]+)?\\s*\\{`,
    'g',
  );

  fixedContent = fixedContent.replace(hookNamedFunctionPattern, (_fullMatch, hookStart, _hookName, params, _returnType) => {
    fixesCount += 1;
    const normalizedParams = params.trim();
    return `${hookStart}(${normalizedParams}) => {`;
  });

  return { fixedContent, fixesCount };
}

// Переносит однострочный `await` в async-функциях на `return`:
// async function fn(): Promise<T> { await call(); }
// ->
// function fn(): Promise<T> { return call(); }
function fixAsyncSingleAwaitTailToReturn(content) {
  let fixedContent = content;
  let fixesCount = 0;

  const functionDeclarationPattern =
    /^([ \t]*)(export\s+)?async function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*(:\s*Promise<[^>\n]+>)?\s*\{\n\1  await\s+([^\n;]+);\n\1\}/gm;

  fixedContent = fixedContent.replace(
    functionDeclarationPattern,
    (_fullMatch, indent, exportPrefix = '', functionName, params, returnType = '', awaitedExpression) => {
      fixesCount += 1;
      const normalizedReturnType = returnType ? `${returnType}` : '';
      return `${indent}${exportPrefix}function ${functionName}(${params})${normalizedReturnType} {\n${indent}  return ${awaitedExpression};\n${indent}}`;
    },
  );

  const arrowFunctionPattern =
    /^([ \t]*)(export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*async\s*\(([^)]*)\)\s*(:\s*Promise<[^>\n]+>)?\s*=>\s*\{\n\1  await\s+([^\n;]+);\n\1\};/gm;

  fixedContent = fixedContent.replace(
    arrowFunctionPattern,
    (_fullMatch, indent, exportPrefix = '', variableName, params, returnType = '', awaitedExpression) => {
      fixesCount += 1;
      const normalizedReturnType = returnType ? `${returnType}` : '';
      return `${indent}${exportPrefix}const ${variableName} = (${params})${normalizedReturnType} => {\n${indent}  return ${awaitedExpression};\n${indent}};`;
    },
  );

  return { fixedContent, fixesCount };
}

// Переносит подключение локального стиля из <style src="..."></style> в импорт
// в начало <script setup lang="ts"> и оставляет пустую строку после него.
function fixVueStyleImportPlacement(content) {
  let fixedContent = content;
  let fixesCount = 0;

  const styleSrcTagPattern = /<style\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*><\/style>\s*/g;
  const styleSrcMatch = fixedContent.match(styleSrcTagPattern);
  const stylePathMatch = fixedContent.match(/<style\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*><\/style>/);
  const stylePath = stylePathMatch?.[1] ?? '';
  const emptyStyleTagPattern = /<style\b[^>]*>\s*<\/style>\s*/g;
  const emptyStyleTagMatches = fixedContent.match(emptyStyleTagPattern) ?? [];

  if (emptyStyleTagMatches.length) {
    fixedContent = fixedContent.replace(emptyStyleTagPattern, '');
    fixesCount += emptyStyleTagMatches.length;
  }

  if (!stylePath) {
    return { fixedContent, fixesCount };
  }

  // Удаляем style src tag из файла.
  if (styleSrcMatch?.length) {
    fixedContent = fixedContent.replace(styleSrcTagPattern, '');
    fixesCount += styleSrcMatch.length;
  }

  const scriptSetupPattern = /<script\s+setup\s+lang="ts">\r?\n([\s\S]*?)\r?\n<\/script>/m;
  const scriptSetupMatch = fixedContent.match(scriptSetupPattern);
  if (!scriptSetupMatch) {
    return { fixedContent, fixesCount };
  }

  const scriptBody = scriptSetupMatch[1];
  const scriptLines = scriptBody.split(/\r?\n/);
  const styleImportLine = `import '${stylePath}'`;
  const styleImportPattern = /^\s*import\s+['"]\.\/[^'"]+\.(scss|sass|css|less|styl|pcss)['"]\s*;?\s*$/;

  let firstMeaningfulIndex = -1;
  for (let index = 0; index < scriptLines.length; index += 1) {
    if (scriptLines[index].trim() === '') {
      continue;
    }
    firstMeaningfulIndex = index;
    break;
  }

  if (firstMeaningfulIndex === -1) {
    const newScript = `<script setup lang="ts">\n${styleImportLine}\n\n</script>`;
    fixedContent = fixedContent.replace(scriptSetupPattern, newScript);
    fixesCount += 1;
    return { fixedContent, fixesCount };
  }

  if (!styleImportPattern.test(scriptLines[firstMeaningfulIndex])) {
    scriptLines.splice(firstMeaningfulIndex, 0, styleImportLine);
    fixesCount += 1;
    firstMeaningfulIndex += 1;
  }

  if (scriptLines[firstMeaningfulIndex + 1]?.trim() !== '') {
    scriptLines.splice(firstMeaningfulIndex + 1, 0, '');
    fixesCount += 1;
  }

  const updatedScriptBody = scriptLines.join('\n');
  const newScript = `<script setup lang="ts">\n${updatedScriptBody}\n</script>`;
  fixedContent = fixedContent.replace(scriptSetupPattern, newScript);

  return { fixedContent, fixesCount };
}

// Делает импорт локального стиля первым в <script setup> и добавляет пустую строку после него.
function fixVueStyleImportFirstAndSpacing(content) {
  let fixedContent = content;
  let fixesCount = 0;

  const scriptSetupPattern = /<script\s+setup\s+lang="ts">\r?\n([\s\S]*?)\r?\n<\/script>/m;
  const scriptSetupMatch = fixedContent.match(scriptSetupPattern);
  if (!scriptSetupMatch) {
    return { fixedContent, fixesCount };
  }

  const scriptLines = scriptSetupMatch[1].split(/\r?\n/);
  const styleImportPattern = /^\s*import\s+['"]\.\/[^'"]+\.(scss|sass|css|less|styl|pcss)['"]\s*;?\s*$/;

  const styleImportIndex = scriptLines.findIndex((line) => styleImportPattern.test(line));
  if (styleImportIndex < 0) {
    return { fixedContent, fixesCount };
  }

  const styleImportLine = scriptLines[styleImportIndex].trim().replace(/;$/, '');

  let firstMeaningfulIndex = -1;
  for (let index = 0; index < scriptLines.length; index += 1) {
    if (scriptLines[index].trim() === '') {
      continue;
    }
    firstMeaningfulIndex = index;
    break;
  }

  if (firstMeaningfulIndex >= 0 && styleImportIndex !== firstMeaningfulIndex) {
    scriptLines.splice(styleImportIndex, 1);
    scriptLines.splice(firstMeaningfulIndex, 0, styleImportLine);
    fixesCount += 1;
  }

  const normalizedFirstStyleIndex = scriptLines.findIndex((line) => styleImportPattern.test(line));
  if (normalizedFirstStyleIndex >= 0 && scriptLines[normalizedFirstStyleIndex + 1]?.trim() !== '') {
    scriptLines.splice(normalizedFirstStyleIndex + 1, 0, '');
    fixesCount += 1;
  }

  const updatedScriptBody = scriptLines.join('\n');
  const newScript = `<script setup lang="ts">\n${updatedScriptBody}\n</script>`;
  fixedContent = fixedContent.replace(scriptSetupPattern, newScript);

  return { fixedContent, fixesCount };
}

// Нормализует алиасы вида "@/folder/path" в "@folder/path".
function fixRootAliasToCatalogAlias(content) {
  let fixedContent = content;
  let fixesCount = 0;

  const aliasImportPattern = /(from\s+['"])@\/([a-zA-Z0-9_-]+)\/([^'"]+)(['"])/g;
  fixedContent = fixedContent.replace(aliasImportPattern, (_fullMatch, prefix, catalogName, pathTail, suffix) => {
    fixesCount += 1;
    return `${prefix}@${catalogName}/${pathTail}${suffix}`;
  });

  const aliasSideEffectImportPattern = /(import\s+['"])@\/([a-zA-Z0-9_-]+)\/([^'"]+)(['"])/g;
  fixedContent = fixedContent.replace(aliasSideEffectImportPattern, (_fullMatch, prefix, catalogName, pathTail, suffix) => {
    fixesCount += 1;
    return `${prefix}@${catalogName}/${pathTail}${suffix}`;
  });

  const sharedHashImportPattern = /(from\s+['"])#shared\/([^'"]+)(['"])/g;
  fixedContent = fixedContent.replace(sharedHashImportPattern, (_fullMatch, prefix, pathTail, suffix) => {
    fixesCount += 1;
    return `${prefix}@shared/${pathTail}${suffix}`;
  });

  const sharedHashSideEffectImportPattern = /(import\s+['"])#shared\/([^'"]+)(['"])/g;
  fixedContent = fixedContent.replace(sharedHashSideEffectImportPattern, (_fullMatch, prefix, pathTail, suffix) => {
    fixesCount += 1;
    return `${prefix}@shared/${pathTail}${suffix}`;
  });

  return { fixedContent, fixesCount };
}

function toPascalCase(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join('');
}

function toSingularName(value) {
  if (value.endsWith('ies') && value.length > 3) {
    return `${value.slice(0, -3)}y`;
  }
  if (value.endsWith('s') && value.length > 1) {
    return value.slice(0, -1);
  }
  return value;
}

function insertTypeDeclarationNearTop(content, declarationText) {
  const lines = content.split(/\r?\n/);
  let insertIndex = 0;

  while (insertIndex < lines.length) {
    const trimmed = lines[insertIndex].trim();
    if (trimmed.startsWith('import ') || trimmed.startsWith('export ') && trimmed.includes(' from ')) {
      insertIndex += 1;
      continue;
    }
    if (trimmed === '') {
      insertIndex += 1;
      continue;
    }
    break;
  }

  const block = declarationText.split('\n');
  lines.splice(insertIndex, 0, ...block, '');
  return lines.join('\n');
}

// Выносит inline Array<{ ... }> в именованный interface внутри текущего файла.
function fixInlineArrayObjectTypes(content) {
  let fixedContent = content;
  let fixesCount = 0;

  const propertyInlineArrayPattern = /(\b([A-Za-z_$][\w$]*)\s*:\s*)Array<\{\s*([\s\S]*?)\s*\}>/g;
  const pendingDeclarations = [];

  fixedContent = fixedContent.replace(propertyInlineArrayPattern, (fullMatch, prefix, propertyName, objectBodyRaw) => {
    const objectBody = objectBodyRaw.trim();
    if (!objectBody || !/:\s*/.test(objectBody)) {
      return fullMatch;
    }

    const singularProperty = toSingularName(propertyName);
    const typeBaseName = toPascalCase(singularProperty);
    const interfaceName = `${typeBaseName || 'Inline'}Item`;

    if (new RegExp(`\\b(?:interface|type)\\s+${interfaceName}\\b`).test(fixedContent)) {
      fixesCount += 1;
      return `${prefix}Array<${interfaceName}>`;
    }

    const normalizedFields = objectBody
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `  ${line.replace(/;$/, '')}`)
      .join('\n');

    pendingDeclarations.push(`interface ${interfaceName} {\n${normalizedFields}\n}`);
    fixesCount += 1;
    return `${prefix}Array<${interfaceName}>`;
  });

  if (!pendingDeclarations.length) {
    return { fixedContent, fixesCount };
  }

  const uniqueDeclarations = [...new Set(pendingDeclarations)];
  for (const declaration of uniqueDeclarations) {
    if (fixedContent.includes(declaration.split('\n')[0])) {
      continue;
    }
    fixedContent = insertTypeDeclarationNearTop(fixedContent, declaration);
  }

  return { fixedContent, fixesCount };
}

// Выносит inline object return type у exported function в именованный type.
// Пример:
// export function validate(): { ok: boolean } { ... }
// =>
// type ValidateReturn = { ok: boolean };
// export function validate(): ValidateReturn { ... }
function fixInlineExportedReturnObjectTypes(content) {
  let fixedContent = content;
  let fixesCount = 0;

  const exportedInlineReturnPattern =
    /export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*:\s*\{([\s\S]*?)\}\s*\{/g;
  const pendingTypeDeclarations = [];

  fixedContent = fixedContent.replace(
    exportedInlineReturnPattern,
    (fullMatch, asyncPrefix = '', functionName, params, returnObjectBody) => {
      const returnBody = (returnObjectBody ?? '').trim();
      if (!returnBody || !/:\s*/.test(returnBody)) {
        return fullMatch;
      }

      const typeName = `${toPascalCase(functionName)}Return`;
      const typeDeclaration = `type ${typeName} = {\n${returnBody
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `  ${line.replace(/;$/, '')}`)
        .join('\n')}\n};`;

      if (!new RegExp(`\\b(?:type|interface)\\s+${typeName}\\b`).test(fixedContent)) {
        pendingTypeDeclarations.push(typeDeclaration);
      }

      fixesCount += 1;
      return `export ${asyncPrefix}function ${functionName}(${params}): ${typeName} {`;
    },
  );

  if (!pendingTypeDeclarations.length) {
    return { fixedContent, fixesCount };
  }

  const uniqueDeclarations = [...new Set(pendingTypeDeclarations)];
  for (const declaration of uniqueDeclarations) {
    if (fixedContent.includes(declaration.split('\n')[0])) {
      continue;
    }
    fixedContent = insertTypeDeclarationNearTop(fixedContent, declaration);
  }

  return { fixedContent, fixesCount };
}

function inferSimpleVariableType(initializerRaw) {
  const initializer = initializerRaw.trim();

  if (/^computed\s*</.test(initializer) || /^computed\s*\(/.test(initializer)) {
    return null;
  }
  if (initializer.includes('?') && initializer.includes(':')) {
    return null;
  }

  // Пропускаем выражения с generic-параметрами — они не являются простыми типами.
  if (/\b(?:ref|computed|reactive|shallowRef|shallowReactive|readonly|toRef|toRefs|defineProps|defineEmits|withDefaults|customRef|triggerRef)\s*[<(]/.test(initializer)) {
    return null;
  }
  if (/\bnew\s+(?:Map|Set|WeakMap|WeakSet|Array|Promise|ReadonlyMap|ReadonlySet|Record)\s*</.test(initializer)) {
    return null;
  }

  if (/^['"`][\s\S]*['"`]$/.test(initializer)) {
    return 'string';
  }
  if (/^-?\d+(?:\.\d+)?$/.test(initializer)) {
    return 'number';
  }
  if (/^(true|false)$/.test(initializer)) {
    return 'boolean';
  }
  if (/\?\?\s*['"`][\s\S]*['"`]\s*$/.test(initializer)) {
    return 'string';
  }
  if (/\?\?\s*-?\d+(?:\.\d+)?\s*$/.test(initializer)) {
    return 'number';
  }
  if (/\?\?\s*(true|false)\s*$/.test(initializer)) {
    return 'boolean';
  }
  // Примечание: || и && НЕ включены, т.к. они не всегда возвращают boolean.
  if (/^[^?:]*\s*(!|===|!==|==|!=|>=|<=|>|<)\s*[^?:]*$/.test(initializer)) {
    return 'boolean';
  }
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\?.[A-Za-z_$][\w$]*|\[[^\]]+\])*\s*[-+*/]\s*.+$/.test(initializer)) {
    return 'number';
  }

  return null;
}

// Удаляет ошибочные аннотации `: boolean` у переменных, чей инициализатор
// содержит generic-параметры (ref<T>, defineProps<T>, new Map<K,V> и т.д.),
// а также выражения с || и &&, которые не всегда возвращают boolean.
function fixRemoveIncorrectBooleanAnnotations(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^(\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*): boolean = (.+)$/);

    if (!match) {
      continue;
    }

    const [, prefix, initializer] = match;
    const initTrimmed = initializer.trim().replace(/;.*$/, '').trim();

    // Сохраняем корректные аннотации для простых булевых литералов.
    if (initTrimmed === 'true' || initTrimmed === 'false') {
      continue;
    }

    // Сохраняем корректные аннотации для простых сравнений без вызовов методов.
    if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\s*(===|!==|==|!=|>=|<=|>|<)\s/.test(initTrimmed) && !initTrimmed.includes('<')) {
      continue;
    }

    // Сохраняем корректные аннотации для унарного отрицания.
    if (/^![A-Za-z(]/.test(initTrimmed) && !initTrimmed.includes('.')) {
      continue;
    }

    // Удаляем : boolean — аннотация ошибочна для всех остальных случаев.
    lines[i] = `${prefix} = ${initializer}`;
    fixesCount += 1;
  }

  return { fixedContent: lines.join('\n'), fixesCount };
}

// Проверяет, используется ли идентификатор как значение в коде (не в типе).
function isIdentifierUsedAsValue(name, content) {
  // Убираем BOM если есть
  const cleanContent = content.replace(/^\uFEFF/, '');

  // Вызовы функций: Name(
  if (new RegExp(`\\b${name}\\s*\\(`).test(cleanContent)) return true;

  // Доступ к члену enum: Name.Member (но не Name[] — это тип массива)
  if (new RegExp(`\\b${name}\\s*\\.(?:\\s*[A-Za-z_$])`).test(cleanContent)) return true;

  // Индексный доступ с содержимым: Name[expr] (но не Name[] — тип массива)
  if (new RegExp(`\\b${name}\\s*\\[\\s*[^\\s\\]]`).test(cleanContent)) return true;

  // Использование в сравнении: === Name, !== Name, == Name, != Name
  if (new RegExp(`[!=]==?\\s*${name}\\b`).test(cleanContent)) return true;

  // Использование в присваивании: = Name (но не == или != или <= или >=)
  if (new RegExp(`[^!=<>]=\\s*${name}\\b`).test(cleanContent)) return true;

  // Использование как return: return Name
  if (new RegExp(`return\\s+${name}\\b`).test(cleanContent)) return true;

  // Использование как аргумент функции: (Name или , Name)
  if (new RegExp(`[,(]\\s*${name}\\b`).test(cleanContent)) return true;

  // Использование в spread: ...Name
  if (new RegExp(`\\.\\.\\.\\s*${name}\\b`).test(cleanContent)) return true;

  // Использование в template literal: ${Name}
  if (new RegExp(`\\$\\{[^}]*\\b${name}\\b`).test(cleanContent)) return true;

  // Использование в экспорте: export { Name }
  if (new RegExp(`export\\s+\\{[^}]*\\b${name}\\b`).test(cleanContent)) return true;

  // Использование в массиве/объекте: [Name, или { Name, или Name:
  if (new RegExp(`\\[\\s*${name}\\b`).test(cleanContent)) return true;
  if (new RegExp(`\\{\\s*${name}\\s*[:,]`).test(cleanContent)) return true;

  return false;
}

// Исправляет `import type { X }` → `import { X }` для идентификаторов,
// которые используются как значения (вызовы функций, доступ к членам enum).
// Также исправляет обратный случай: `import { TypeOnly }` → `import type { TypeOnly }`.
function fixImportTypeForValues(content) {
  // Убираем BOM для корректной работы regex.
  const bom = content.startsWith('\uFEFF') ? '\uFEFF' : '';
  let fixedContent = bom ? content.slice(1) : content;
  let fixesCount = 0;

  // Проход 1: import type { ... } → разделяем value и type идентификаторы.
  const importTypeRegex = /^import type \{([^}]+)\} from ['"]([^'"]+)['"];?\s*$/gm;

  fixedContent = fixedContent.replace(importTypeRegex, (fullMatch, identifiersStr, modulePath) => {
    const identifiers = identifiersStr.split(',').map((s) => s.trim()).filter(Boolean);
    const valueIds = [];
    const typeIds = [];

    const contentWithoutImport = fixedContent.replace(fullMatch, '');

    for (const id of identifiers) {
      const name = id.trim();

      if (isIdentifierUsedAsValue(name, contentWithoutImport)) {
        valueIds.push(name);
      } else {
        typeIds.push(name);
      }
    }

    if (valueIds.length === 0) {
      return fullMatch;
    }

    fixesCount += 1;

    let result = `import { ${valueIds.join(', ')} } from '${modulePath}'`;

    if (typeIds.length > 0) {
      result += `\nimport type { ${typeIds.join(', ')} } from '${modulePath}'`;
    }

    return result;
  });

  return { fixedContent: bom + fixedContent, fixesCount };
}

// Добавляет явные аннотации для локальных переменных в безопасно-выводимых случаях.
function fixExplicitVariableAnnotations(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;
  let inScriptSetup = !content.includes('<script');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (/^<script\s+setup\s+lang="ts"\s*>/.test(trimmed)) {
      inScriptSetup = true;
      continue;
    }
    if (/^<\/script>/.test(trimmed)) {
      inScriptSetup = false;
      continue;
    }
    if (!inScriptSetup) {
      continue;
    }
    if (!/^(const|let|var)\s+/.test(trimmed)) {
      continue;
    }
    if (/^(const|let|var)\s+[{[]/.test(trimmed)) {
      continue;
    }
    if (/^(const|let|var)\s+[A-Za-z_$][\w$]*\s*:/.test(trimmed)) {
      continue;
    }
    if (/=\s*use[A-Z][A-Za-z0-9_]*(?:\s*<[^>]+>)?\s*\(/.test(trimmed)) {
      continue;
    }

    const declarationMatch = line.match(/^(\s*)(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(.+?)(;)?\s*$/);
    if (!declarationMatch) {
      continue;
    }

    const [, indent, declarationKind, variableName, initializer, semicolon] = declarationMatch;
    const inferredType = inferSimpleVariableType(initializer);
    if (!inferredType) {
      continue;
    }

    lines[index] = `${indent}${declarationKind} ${variableName}: ${inferredType} = ${initializer}${semicolon ?? ''}`;
    fixesCount += 1;
  }

  return {
    fixedContent: lines.join('\n'),
    fixesCount,
  };
}

// Запускает `eslint --fix` и, если доступен, `prettier` для дочистки форматных правок.
function runEslintFix() {
  const eslintCli = resolve(repoRoot, 'node_modules/eslint/bin/eslint.js');
  const hasEslintFlatConfig =
    existsSync(resolve(repoRoot, 'eslint.config.js')) ||
    existsSync(resolve(repoRoot, 'eslint.config.mjs')) ||
    existsSync(resolve(repoRoot, 'eslint.config.cjs'));
  const isFileTarget = statSync(targetPath).isFile();

  if (existsSync(eslintCli) && hasEslintFlatConfig) {
    spawnSync(process.execPath, [eslintCli, '--fix', inputTargetRaw], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  }

  // Запускаем prettier, если он установлен
  const prettierCli = resolve(repoRoot, 'node_modules/prettier/bin/prettier.cjs');
  if (existsSync(prettierCli)) {
    const prettierTarget = isFileTarget ? inputTargetRaw : `${inputTarget}/**/*.{ts,vue,js,json,css}`;
    spawnSync(process.execPath, [prettierCli, '--write', prettierTarget], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  }
}

const filePaths = [];
walkDirectory(targetPath, (filePath) => filePaths.push(filePath));

const contentFixers = [
  fixDuplicateFunctionTyping,
  fixDuplicateHookGenericTyping,
  fixSingleChainLadder,
  fixSimpleGuardIfReturn,
  fixPiniaStoreSelectorFormatting,
  fixDefinePropsEmitsBlankLine,
  fixStoreDeclarationBlankLine,
  fixVueLifecycleNamedFunction,
  fixAsyncSingleAwaitTailToReturn,
  fixVoidFireAndForgetCalls,
  fixCollapseExtraBlankLinesBeforeIf,
  fixBlankLineBeforeIf,
  fixBlankLineBetweenConsecutiveIf,
  fixBlankLineBeforeReturn,
  fixVueStyleImportPlacement,
  fixVueStyleImportFirstAndSpacing,
  fixRootAliasToCatalogAlias,
  fixInlineArrayObjectTypes,
  fixInlineExportedReturnObjectTypes,
  fixRemoveIncorrectBooleanAnnotations,
  fixImportTypeForValues,
  fixExplicitVariableAnnotations,
];

for (const filePath of filePaths) {
  if (!/\.(ts|vue)$/.test(filePath)) {
    continue;
  }

  const sourceContent = readFileSync(filePath, 'utf-8');
  let fixedContent = sourceContent;
  let fixesCount = 0;

  // Применяем фиксеры в нескольких проходах, так как некоторые трансформации могут открывать другие.
  // Пример: именованная функция в хуке -> стрелочная функция -> инлайновый вызов хука.
  for (let passIndex = 0; passIndex < maxFixPassesPerFile; passIndex += 1) {
    const passSource = fixedContent;
    let passFixesCount = 0;

    for (const applyFix of contentFixers) {
      const fixResult = applyFix(fixedContent);
      fixedContent = fixResult.fixedContent;
      passFixesCount += fixResult.fixesCount;
    }

    fixesCount += passFixesCount;

    if (!passFixesCount || fixedContent === passSource) {
      break;
    }
  }

  if (!fixesCount || fixedContent === sourceContent) {
    continue;
  }

  writeFileSync(filePath, fixedContent, 'utf-8');
  totalFixes += fixesCount;
  updatedFiles.push(filePath.split(sep).join('/'));
}

runEslintFix();

if (!updatedFiles.length) {
  console.log(`No autofixes applied for target: ${inputTarget}`);
  process.exit(0);
}

console.log(`Applied ${totalFixes} rules autofix(es) in ${updatedFiles.length} file(s):`);

for (const filePath of updatedFiles) {
  console.log(`  ${filePath}`);
}
