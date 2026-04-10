import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const inputTarget = process.argv[2] ?? 'src';
const targetPath = resolve(repoRoot, inputTarget);
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

// Обеспечивает пустую строку после объявления Pinia store в composables/components:
// const useStore = useSomeStore();
//
// const someVar = ...
function fixStoreDeclarationBlankLine(content) {
  const lines = content.split(/\r?\n/);
  let fixesCount = 0;

  for (let index = 0; index < lines.length - 1; index += 1) {
    const currentTrimmed = lines[index].trim();

    // Пропускаем строки, которые уже являются частью селектора (внутри store())
    if (/^\(state\)\s*=>/.test(currentTrimmed) || /^state\s*=>/.test(currentTrimmed)) {
      continue;
    }

    if (!/^const\s+\w+.*=\s*use[A-Z]\w*Store\(/.test(currentTrimmed)) {
      continue;
    }

    // Если это многострочное объявление с селектором, ищем закрывающую строку
    if (!currentTrimmed.endsWith(');') && !currentTrimmed.endsWith(')')) {
      let scanIndex = index + 1;
      let depth = 1;
      while (scanIndex < lines.length && depth > 0) {
        depth += (lines[scanIndex].match(/\(/g) ?? []).length;
        depth -= (lines[scanIndex].match(/\)/g) ?? []).length;
        scanIndex += 1;
      }
      if (scanIndex > 0) {
        index = scanIndex - 1;
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

// Запускает `eslint --fix` и, если доступен, `prettier` для дочистки форматных правок.
function runEslintFix() {
  const eslintCli = resolve(repoRoot, 'node_modules/eslint/bin/eslint.js');

  if (existsSync(eslintCli)) {
    spawnSync(process.execPath, [eslintCli, '--fix', inputTarget], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  }

  // Запускаем prettier, если он установлен
  const prettierCli = resolve(repoRoot, 'node_modules/prettier/bin/prettier.cjs');
  if (existsSync(prettierCli)) {
    spawnSync(process.execPath, [prettierCli, '--write', `${inputTarget}/**/*.{ts,vue,js,json,css}`], {
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
