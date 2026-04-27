import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const inputTargetRaw = process.argv[2] ?? 'src';
const inputTarget = inputTargetRaw.replace(/\\/g, '/');
const targetPath = resolve(repoRoot, inputTargetRaw);
const skippedDirectoryNames = new Set(['node_modules', '.nuxt', '.output', '.git']);

if (!existsSync(targetPath)) {
  console.error(`Целевая директория не существует: ${inputTarget}`);
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
          `Line ${lineNumber}: переместите блок "${blockName}" раньше, чтобы соблюсти порядок блоков в <script setup>`,
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
      // Skip JSDoc comments and blank lines within them to find actual block boundary
      let lookbackIndex = currentLineIndex - 1;
      while (lookbackIndex >= 0) {
        const lookbackTrimmed = lines[lookbackIndex].trim();
        if (lookbackTrimmed === '') {
          break;
        }
        if (lookbackTrimmed.startsWith('/**') || lookbackTrimmed.startsWith('*') || lookbackTrimmed.endsWith('*/')) {
          lookbackIndex -= 1;
          continue;
        }
        break;
      }
      const previousLine = lines[lookbackIndex] ?? '';
      const hasBlankLineBeforeCurrentBlock = previousLine.trim() === '';

      if (hasBlankLineBeforeCurrentBlock) {
        continue;
      }

      pushFinding(
        'style/script-setup-block-separation',
        filePath,
        `Line ${currentBlock.lineNumber}: добавьте пустую строку между блоками "${previousBlock.blockName}" и "${currentBlock.blockName}"`,
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
            `Line ${chainEndLineIdx + 2}: добавьте пустую строку после блока(ов) use*Store(...) перед локальными вычислениями и state`,
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

// Проверяет обязательную аннотацию типа у локальных переменных в заданном диапазоне строк.
function runExplicitVariableAnnotationHeuristics({ filePath, lines, startLine, endLine }) {
  for (let index = startLine; index < endLine; index += 1) {
    const trimmedLine = lines[index].trim();

    // Skip declarations where explicit annotation is not applicable or ambiguous for regex heuristic.
    if (!/^(const|let|var)\s+/.test(trimmedLine)) {
      continue;
    }
    
    if (trimmedLine.startsWith('const {') || trimmedLine.startsWith('let {') || trimmedLine.startsWith('var {')) {
      continue;
    }

    if (trimmedLine.startsWith('const [') || trimmedLine.startsWith('let [') || trimmedLine.startsWith('var [')) {
      continue;
    }

    if (!trimmedLine.includes('=')) {
      continue;
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
    const _nestedGeneric = '(?:[^<>]|<[^<>]*>)*';
    const isRefInitializer = /=\s*ref(?:\s*<(?:[^<>]|<[^<>]*>)*>)?\s*\(/.test(trimmedLine);
    const isComputedInitializer = /=\s*computed(?:\s*<(?:[^<>]|<[^<>]*>)*>)?\s*\(/.test(trimmedLine);
    const isHookCallInitializer = /=\s*use[A-Z][A-Za-z0-9_]*(?:\s*<(?:[^<>]|<[^<>]*>)*>)?\s*\(/.test(trimmedLine);
    const isVueMacroCall = /=\s*(withDefaults\s*\(\s*defineProps|defineProps\s*[<(]|defineEmits\s*[<(])/.test(trimmedLine);
    // Detect multiline arrow function: const name = ( ...params on next lines... ) => {
    const isMultilineArrowStart = /=\s*(async\s*)?\(\s*$/.test(trimmedLine);
    let isMultilineArrowFunction = false;

    if (isMultilineArrowStart) {
      for (let j = index + 1; j < Math.min(index + 10, endLine); j += 1) {
        if (/=>/.test(lines[j].trim())) {
          isMultilineArrowFunction = true;
          break;
        }
      }
    }

    const variableAnnotationMatch = trimmedLine.match(/^(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*:\s*([^=]+?)\s*=/);
    const variableAnnotationRaw = variableAnnotationMatch?.[1]?.trim() ?? '';
    const normalizedVariableAnnotation = variableAnnotationRaw.replace(/\s+/g, '');
    const isScalarHookAnnotation = /^(string|number|boolean)(\|(string|number|boolean))*$/.test(normalizedVariableAnnotation);

    if (hasInlineObjectVariableAnnotation) {
      pushFinding(
        'typing/no-inline-object-variable-type',
        filePath,
        `Line ${index + 1}: встраиваемый объектный тип в аннотации переменной запрещён; используйте именованный тип`,
      );
      continue;
    }

    if (isFunctionAssignment && hasVariableAnnotation && hasInlineFunctionAnnotation) {
      pushFinding(
        'typing/duplicate-function-typing',
        filePath,
        `Line ${index + 1}: избегайте дублирования типизации функции на переменной и в реализации`,
      );
      continue;
    }

    if (/^(const|let|var)\s+[A-Za-z_$][\w$]*\s*:\s*ReturnType\s*<\s*typeof\b/.test(trimmedLine)) {
      pushFinding(
        'typing/no-returntype-typeof-variable',
        filePath,
        `Line ${index + 1}: избегайте ReturnType<typeof ...> в аннотациях переменных; используйте прямые именованные типы`,
      );
      continue;
    }

    if (hasVariableAnnotation && isRefInitializer) {
      pushFinding(
        'typing/no-left-annotation-for-ref',
        filePath,
        `Line ${index + 1}: для ref(...) не используйте левую аннотацию типа; оставьте типизацию справа (ref<T>)`,
      );
      continue;
    }

    if (hasVariableAnnotation && isComputedInitializer) {
      pushFinding(
        'typing/no-left-annotation-for-computed',
        filePath,
        `Line ${index + 1}: для computed(...) не используйте левую аннотацию типа; оставьте типизацию справа (computed<T>) или выведите тип`,
      );
      continue;
    }

    if (hasVariableAnnotation && isVueMacroCall) {
      const isDefineEmitsInitializer = /=\s*defineEmits\s*[<(]/.test(trimmedLine);
      const isDefinePropsInitializer =
        /=\s*defineProps\s*[<(]/.test(trimmedLine) || /=\s*withDefaults\s*\(\s*defineProps/.test(trimmedLine);

      if (isDefineEmitsInitializer) {
        pushFinding(
          'typing/no-left-annotation-for-define-emits',
          filePath,
          `Line ${index + 1}: для defineEmits(...) не используйте левую аннотацию типа`,
        );
        continue;
      }

      if (isDefinePropsInitializer) {
        pushFinding(
          'typing/no-left-annotation-for-define-props',
          filePath,
          `Line ${index + 1}: для defineProps/withDefaults(defineProps(...)) не используйте левую аннотацию типа`,
        );
        continue;
      }
    }

    const hasHookGenericOnRight = /=\s*use[A-Z][A-Za-z0-9_]*\s*<[^>]+>\s*\(/.test(trimmedLine);
    if (hasVariableAnnotation && isHookCallInitializer && hasHookGenericOnRight && !isScalarHookAnnotation) {
      pushFinding(
        'typing/no-duplicate-hook-generic-typing',
        filePath,
        `Line ${index + 1}: избегайте дублирования типизации для хуков; оставьте тип слева от переменной и уберите generic из вызова хука`,
      );
      continue;
    }

    if (isHookCallInitializer && !hasVariableAnnotation) {
      continue;
    }

    // ref<T>(...) и computed(...) без левой аннотации — допустимая форма
    // согласно правилам: тип указывается через generic справа (ref<T>) или выводится (computed)
    if ((isRefInitializer || isComputedInitializer) && !hasVariableAnnotation) {
      continue;
    }

    if (hasVariableAnnotation) {
      continue;
    }

    if (isFunctionAssignment && hasInlineFunctionAnnotation) {
      continue;
    }

    if (isVueMacroCall) {
      continue;
    }

    if (isMultilineArrowFunction) {
      continue;
    }

    pushFinding(
      'typing/explicit-variable-annotation',
      filePath,
      `Line ${index + 1}: локальная переменная должна иметь явную аннотацию типа`,
    );
  }
}

// Проверяет дополнительные локальные стилевые соглашения для Vue/Nuxt/Pinia.
function runAdditionalStyleHeuristics({ content, filePath, lines }) {
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

    pushFinding('style/blank-line-before-if', filePath, `Line ${index + 1}: оставьте пустую строку перед блоками if`);
  }

  for (let index = 1; index < lines.length; index += 1) {
    const currentTrimmedLine = lines[index].trim();
    const previousTrimmedLine = lines[index - 1].trim();

    if (!/^if\s*\(/.test(currentTrimmedLine) || !/^if\s*\(/.test(previousTrimmedLine)) {
      continue;
    }

    pushFinding(
      'style/blank-line-between-consecutive-if',
      filePath,
      `Line ${index + 1}: добавьте пустую строку между последовательными операторами if`,
    );
  }

  for (let index = 1; index < lines.length; index += 1) {
    const currentTrimmedLine = lines[index].trim();
    const previousTrimmedLine = lines[index - 1].trim();

    if (!/^return\b/.test(currentTrimmedLine)) {
      continue;
    }

    if (!previousTrimmedLine || previousTrimmedLine.endsWith('{')) {
      continue;
    }

    pushFinding(
      'style/blank-line-before-return',
      filePath,
      `Line ${index + 1}: оставьте пустую строку перед return, если за ним следуют другие выражения`,
    );
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
      `Line ${index + 1}: избегайте "void fn()"; используйте await/return или явную обработку ошибок`,
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
          `Line ${index + 1}: добавьте пустую строку после блока defineEmits перед state/computed`,
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
          `Line ${index + 1}: оставьте пустую строку между use*Store() и объявлениями ref/reactive`,
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
      `Line ${lineNumber}: замените tail await на явный return и уберите лишний модификатор async`,
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
      `Line ${lineNumber}: замените tail await на явный return и уберите лишний модификатор async`,
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
      `Line ${lineNumber}: встраиваемый объектный тип в параметре функции запрещён; переместите его в *.types.ts/types.ts`,
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
      `Line ${lineNumber}: встраиваемый объектный тип в параметре функции запрещён; переместите его в *.types.ts/types.ts`,
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
      `Line ${lineNumber}: встраиваемый объектный тип в параметре функции запрещён; переместите его в *.types.ts/types.ts`,
    );
  }

  // Function params inline small arity
  const multilineSmallArityFunctionPattern = /(export\s+)?(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(([\s\S]*?)\)\s*(?::\s*[^\n]*?)?\s*\{/g;
  for (const functionMatch of content.matchAll(multilineSmallArityFunctionPattern)) {
    const [, , paramsTextRaw] = functionMatch;
    const paramsText = paramsTextRaw ?? '';
    if (!paramsText.includes('\n')) {
      continue;
    }

    const newlineCount = (paramsText.match(/\n/g) ?? []).length;
    if (newlineCount > 3) {
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
      `Line ${lineNumber}: оставьте параметры функции на одной строке для функций с 1-2 параметрами`,
    );
  }

  const multilineSmallArityArrowPattern =
    /(export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::\s*[^\n]*?)?=\s*(?:async\s*)?\(([\s\S]*?)\)\s*(?::\s*[^\n]*?)?\s*=>/g;
  for (const arrowMatch of content.matchAll(multilineSmallArityArrowPattern)) {
    const [, , paramsTextRaw] = arrowMatch;
    const paramsText = paramsTextRaw ?? '';
    if (!paramsText.includes('\n')) {
      continue;
    }

    const newlineCount = (paramsText.match(/\n/g) ?? []).length;
    
    if (newlineCount > 3) {
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
      `Line ${lineNumber}: оставьте параметры функции на одной строке для функций с 1-2 параметрами`,
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
        `Line ${index + 1}: добавьте комментарий TSDoc (/** ... */) перед экспортируемой функцией`,
      );
      continue;
    }

    const hasDescriptionTag = /@description\s+/.test(tsDocBlock);
    const hasReturnTagWithType = /@return\s*\{\s*[^}]+\s*\}\s+/.test(tsDocBlock);

    if (!hasDescriptionTag || !hasReturnTagWithType) {
      pushFinding(
        'style/exported-function-tsdoc-format',
        filePath,
        `Line ${index + 1}: используйте формат TSDoc с @description и @return { Type }`,
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
        `Line ${index + 1}: используйте v-if="condition" вместо {condition && <Component>} в Vue шаблонах`,
      );
    }

    // Проверяем v-for без :key с учетом многострочных тегов.
    if (/<[A-Za-z]/.test(trimmedLine) && /v-for\s*=/.test(trimmedLine)) {
      let tagBuffer = trimmedLine;
      let scanIndex = index + 1;

      while (scanIndex < lines.length && !/>/.test(tagBuffer)) {
        tagBuffer = `${tagBuffer} ${lines[scanIndex].trim()}`;
        scanIndex += 1;
      }

      if (!/:key\s*=/.test(tagBuffer)) {
        pushFinding(
          'style/v-for-requires-key',
          filePath,
          `Line ${index + 1}: V-for должен иметь привязку :key`,
        );
      }
    }

    // Проверяем многоатрибутные теги на одной строке (2+ атрибута должны быть на разных строках)
    const singleLineOpeningTag = trimmedLine.match(/^<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^>\/]+)*)\s*>/);

    if (singleLineOpeningTag && !trimmedLine.startsWith('</')) {
      const attrsPart = singleLineOpeningTag[2];
      const attrMatches = attrsPart.match(/\s+[a-zA-Z@:][a-zA-Z0-9:._-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`))?/g);
      const attrCount = attrMatches ? attrMatches.length : 0;

      if (attrCount >= 2) {
        pushFinding(
          'style/template-multi-attr-single-line',
          filePath,
          `Line ${index + 1}: разверните тег с ${attrCount} атрибутами в многострочный формат (каждый атрибут на новой строке)`,
        );
      }
    }

    // Проверяем инлайн-контент в элементах: <tag ...>content</tag> на одной строке
    // Флагаем только элементы с 2+ атрибутами (1 атрибут — допустимо на одной строке)
    const inlineContentMatch = trimmedLine.match(/<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)>([^<\n]{1,})<\/([a-zA-Z][a-zA-Z0-9]*)>/);

    if (inlineContentMatch) {
      const attrsPart = inlineContentMatch[2];
      const content = inlineContentMatch[3].trim();

      if (content.length > 0) {
        const attrMatches = attrsPart && attrsPart.match(/\s+[a-zA-Z@:][a-zA-Z0-9:._-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`))?/g);
        const attrCount = attrMatches ? attrMatches.length : 0;

        if (attrCount >= 2) {
          pushFinding(
            'style/template-inline-content',
            filePath,
            `Line ${index + 1}: разверните содержимое элемента в многострочный формат (контент на новой строке)`,
          );
        }
      }
    }

    // Проверяем порядок атрибутов: директивы (v-*, @*, :*) должны идти перед статическими (class, id, placeholder)
    // Ищем многострочные блоки атрибутов и проверяем порядок
    if (/<[a-zA-Z]/.test(trimmedLine) && !trimmedLine.includes('/>')) {
      // Собираем все атрибуты из текущего и последующих строк до >
      let attrBlock = trimmedLine;
      let scanIdx = index + 1;
      while (scanIdx < lines.length && !/>/.test(attrBlock)) {
        attrBlock += ' ' + lines[scanIdx].trim();
        scanIdx += 1;
      }

      // Извлекаем атрибуты
      const attrList = [];
      const attrRegex = /^\s*([@:]?v?[a-zA-Z][a-zA-Z0-9:._-]*)(?:\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`))?/gm;
      let attrMatch;
      const tagContent = attrBlock.replace(/^<[^>]+/, '').replace(/>.*$/, '');
      // Re-extract from the full tag
      const fullTagMatch = attrBlock.match(/^<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^>]+)*)/);
      if (fullTagMatch) {
        const attrsPart = fullTagMatch[2];
        const individualAttrs = attrsPart.match(/\s+([@:]?v?[a-zA-Z][a-zA-Z0-9:._-]*)(?:\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`))?/g);
        if (individualAttrs && individualAttrs.length >= 2) {
          // Classify each attribute: directive (v-*, @*, :*) or static (class, id, etc.)
          const isDirective = (attr) => /^\s*(v-|@|:)/.test(attr);
          let lastDirectiveIdx = -1;
          let firstStaticIdx = -1;

          for (let ai = 0; ai < individualAttrs.length; ai++) {
            if (isDirective(individualAttrs[ai])) {
              lastDirectiveIdx = ai;
            } else if (firstStaticIdx < 0) {
              firstStaticIdx = ai;
            }
          }

          // Violation: a static attribute appears before a directive
          if (firstStaticIdx >= 0 && lastDirectiveIdx >= 0 && firstStaticIdx < lastDirectiveIdx) {
            pushFinding(
              'style/template-attr-order',
              filePath,
              `Line ${index + 1}: директивы (v-*, @*, :*) должны идти перед статическими атрибутами (class, id, placeholder)`,
            );
          }
        }
      }
    }
  }

  runVueScriptBlockOrderHeuristics({ filePath, lines });
  runPiniaStoreGroupSeparationHeuristics({ filePath, lines });
}

// Проверяет правила для composables: export const useXxx и обязательный JSDoc/TSDoc перед экспортом.
function runComposableHeuristics({ filePath, lines }) {
  const normalizedPath = filePath.split(sep).join('/');
  if (!normalizedPath.includes('/src/composables/')) {
    return;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const trimmedLine = lines[index].trim();
    const exportedComposableFunctionPattern = /^export\s+(async\s+)?function\s+use[A-Z][A-Za-z0-9_]*\s*\(/;
    const exportedComposableConstPattern = /^export\s+const\s+use[A-Z][A-Za-z0-9_]*\s*=/;

    if (exportedComposableFunctionPattern.test(trimmedLine)) {
      pushFinding(
        'composables/export-const-required',
        filePath,
        `Line ${index + 1}: экспортируйте composables через const (export const useXxx = ...), не через объявление функции`,
      );
      continue;
    }

    if (!exportedComposableConstPattern.test(trimmedLine)) {
      continue;
    }

    const jsDocBlock = getTsDocBeforeLine(lines, index);
    if (!jsDocBlock) {
      pushFinding(
        'composables/exported-jsdoc',
        filePath,
        `Line ${index + 1}: добавьте комментарий JSDoc/TSDoc (/** ... */) перед экспортируемым composable`,
      );
      continue;
    }

    if (!/@description\s+/.test(jsDocBlock)) {
      pushFinding(
        'composables/exported-jsdoc-format',
        filePath,
        `Line ${index + 1}: включите @description в JSDoc/TSDoc экспортируемого composable`,
      );
    }
  }
}

// Проверяет, что импорты из одного логического источника не раздроблены на несколько строк.
function runImportMergeHeuristics({ filePath, lines }) {
  const importEntries = [];
  const importFromPattern = /^\s*import\s+(type\s+)?(.+?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/;
  const sideEffectImportPattern = /^\s*import\s+['"][^'"]+['"]\s*;?\s*$/;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.startsWith('import ')) {
      continue;
    }
    if (sideEffectImportPattern.test(line)) {
      continue;
    }

    const match = line.match(importFromPattern);
    if (!match) {
      continue;
    }

    const source = match[3];
    importEntries.push({
      source,
      lineNumber: index + 1,
    });
  }

  const byExactSource = new Map();
  for (const entry of importEntries) {
    const current = byExactSource.get(entry.source) ?? [];
    current.push(entry);
    byExactSource.set(entry.source, current);
  }

  for (const [source, entries] of byExactSource.entries()) {
    if (entries.length < 2) {
      continue;
    }

    const lineNumbers = entries.map((entry) => entry.lineNumber).join(', ');
    pushFinding(
      'style/merge-imports-same-source',
      filePath,
      `Lines ${lineNumbers}: объедините импорты из '${source}' в одну строку import`,
    );
  }

  const normalizeLogicalImportSource = (source) => source.replace(/\/index\.types$/, '');
  const byLogicalSource = new Map();

  for (const entry of importEntries) {
    const logicalSource = normalizeLogicalImportSource(entry.source);
    const current = byLogicalSource.get(logicalSource) ?? [];
    current.push(entry);
    byLogicalSource.set(logicalSource, current);
  }

  for (const [logicalSource, entries] of byLogicalSource.entries()) {
    if (entries.length < 2) {
      continue;
    }

    const uniqueSources = [...new Set(entries.map((entry) => entry.source))];
    if (uniqueSources.length < 2) {
      continue;
    }

    const hasIndexTypesSource = uniqueSources.some((source) => /\/index\.types$/.test(source));
    if (!hasIndexTypesSource) {
      continue;
    }

    const lineNumbers = entries.map((entry) => entry.lineNumber).join(', ');
    pushFinding(
      'style/merge-imports-logical-source',
      filePath,
      `Lines ${lineNumbers}: объедините runtime/type импорты логического модуля '${logicalSource}' в один источник`,
    );
  }
}

// Проверяет, что в Vue SFC нет секции <style>, а стили подключены через import в начале <script setup>.
function runVueStyleImportHeuristics({ content, filePath, lines }) {
  const styleTagPattern = /<style\b[^>]*>/g;
  const firstStyleTagMatch = styleTagPattern.exec(content);
  if (firstStyleTagMatch) {
    const styleLineNumber = getLineNumberByOffset(content, firstStyleTagMatch.index ?? 0);
    pushFinding(
      'style/vue-sfc-no-style-block',
      filePath,
      `Line ${styleLineNumber}: секция <style> запрещена; оставьте в .vue только <template> и <script setup lang="ts">`,
    );
  }

  // Проверяем локальные константы в <script setup>, которые должны быть в *.constants.ts
  // Ищем const SOMETHING = [...] или const SOMETHING: Type[] = [...] (не ref, не computed, не функцию)
  const scriptSetupStart = lines.findIndex((line) => /^<script\s+setup\s+lang="ts"\s*>/.test(line.trim()));
  if (scriptSetupStart >= 0) {
    let scriptSetupEnd = -1;
    for (let index = scriptSetupStart + 1; index < lines.length; index += 1) {
      if (/^<\/script>/.test(lines[index].trim())) {
        scriptSetupEnd = index;
        break;
      }
    }

    if (scriptSetupEnd >= 0) {
      for (let index = scriptSetupStart + 1; index < scriptSetupEnd; index += 1) {
        const line = lines[index];
        // Ищем статические константы: const NAME = [...] или const NAME: Type[] = [...]
        // Исключаем: ref(), computed(), reactive(), defineProps(), defineEmits(), use*(), функции, импорты
        const fullLine = line.trim();

        // Пропускаем импорты и директивы
        if (fullLine.startsWith('import') || fullLine.startsWith('//') || fullLine.startsWith('/*')) {
          continue;
        }

        // Пропускаем вызовы функций (ref, computed, reactive, use*, define*, navigateTo и т.д.)
        if (/const\s+\w+\s*(?::\s*[^=]+)?\s*=\s*(ref|computed|reactive|defineProps|defineEmits|use\w+|navigateTo|openModal|withDefaults)\b/.test(fullLine)) {
          continue;
        }

        // Ищем const name = [...] или const name: Type[] = [...] (массивные литералы)
        const arrayConstMatch = fullLine.match(/^const\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*\[/);
        if (arrayConstMatch) {
          pushFinding(
            'style/no-local-constants-in-vue',
            filePath,
            `Line ${index + 1}: локальную константу \`${arrayConstMatch[1]}\` вынесите в соседний *.constants.ts`,
          );
          continue;
        }

        // Ищем const NAME = "статическая строка" (UPPER_CASE только)
        const stringConstMatch = fullLine.match(/^const\s+([A-Z][A-Z0-9_]*)\s*(?::\s*[^=]+)?\s*=\s*["']/);
        if (stringConstMatch) {
          pushFinding(
            'style/no-local-constants-in-vue',
            filePath,
            `Line ${index + 1}: локальную константу \`${stringConstMatch[1]}\` вынесите в соседний *.constants.ts`,
          );
          continue;
        }
      }
    }
  }

  const hasScriptStyleImport = /^\s*import\s+['"]\.\/[^'"]+\.(scss|sass|css|less|styl|pcss)['"]\s*;?\s*$/m.test(content);

  if (!hasScriptStyleImport) {
    return;
  }

  const scriptSetupStartIndex = lines.findIndex((line) => /^<script\s+setup\s+lang="ts"\s*>/.test(line.trim()));
  if (scriptSetupStartIndex < 0) {
    return;
  }

  let scriptSetupEndIndex = -1;
  for (let index = scriptSetupStartIndex + 1; index < lines.length; index += 1) {
    if (/^<\/script>/.test(lines[index].trim())) {
      scriptSetupEndIndex = index;
      break;
    }
  }

  if (scriptSetupEndIndex < 0) {
    return;
  }

  const styleImportPattern = /^\s*import\s+['"]\.\/[^'"]+\.(scss|sass|css|less|styl|pcss)['"]\s*;?\s*$/;
  let firstMeaningfulLineIndex = -1;

  for (let index = scriptSetupStartIndex + 1; index < scriptSetupEndIndex; index += 1) {
    if (lines[index].trim() === '') {
      continue;
    }

    firstMeaningfulLineIndex = index;
    break;
  }

  if (firstMeaningfulLineIndex < 0) {
    return;
  }

  if (!styleImportPattern.test(lines[firstMeaningfulLineIndex])) {
    pushFinding(
      'style/vue-style-import-first',
      filePath,
      `Line ${firstMeaningfulLineIndex + 1}: разместите локальный импорт стилей ('./*.scss') как первый оператор в <script setup>`,
    );
    return;
  }

  const nextLine = lines[firstMeaningfulLineIndex + 1] ?? '';
  if (nextLine.trim() !== '') {
    pushFinding(
      'style/vue-style-import-blank-line-after',
      filePath,
      `Line ${firstMeaningfulLineIndex + 2}: добавьте пустую строку после локального импорта стилей в <script setup>`,
    );
  }
}

// Проверяет Nuxt-специфичные соглашения: useAsyncData/useFetch key и границы server/client.
function runNuxtHeuristics({ content, filePath, lines }) {
  const normalizedPath = filePath.split(sep).join('/');
  const isClientLayerFile =
    normalizedPath.includes('/src/') &&
    !normalizedPath.includes('/server/') &&
    !normalizedPath.includes('/.nuxt/') &&
    !normalizedPath.includes('/.output/');

  if (isClientLayerFile) {
    const serverImportPattern =
      /^\s*import\s+.*from\s+['"](?:node:|#internal\/nitro|~\/server\/|@\/server\/|\.{1,2}\/server\/|\/server\/)/;

    lines.forEach((line, index) => {
      if (!serverImportPattern.test(line)) {
        return;
      }

      pushFinding(
        'nuxt/server-client-boundary',
        filePath,
        `Line ${index + 1}: не импортируйте серверные модули в клиентские слои (src/**)`,
      );
    });
  }

  const asyncDataWithoutKeyPattern = /\buseAsyncData\s*\(\s*(?:async\s*)?(?:\([^)]*\)\s*=>|function\s*\()/g;
  for (const match of content.matchAll(asyncDataWithoutKeyPattern)) {
    const lineNumber = getLineNumberByOffset(content, match.index ?? 0);
    pushFinding(
      'nuxt/use-async-data-key',
      filePath,
      `Line ${lineNumber}: укажите явный стабильный ключ в useAsyncData(key, handler, ...)`,
    );
  }

  const useFetchWithoutKeyPattern = /\buseFetch\s*\(\s*[^,\n)]+(?:,\s*\{[\s\S]*?\})?\s*\)/g;
  for (const match of content.matchAll(useFetchWithoutKeyPattern)) {
    const callText = match[0];
    if (/key\s*:/.test(callText)) {
      continue;
    }

    const lineNumber = getLineNumberByOffset(content, match.index ?? 0);
    pushFinding(
      'nuxt/use-fetch-key',
      filePath,
      `Line ${lineNumber}: добавьте явный ключ в useFetch(..., { key: '...' }) для стабильного кэширования между маршрутами`,
    );
  }

  lines.forEach((line, index) => {
    if (!/^\s*import\s+.*['"]@\/.+['"]\s*;?\s*$/.test(line) && !/^\s*export\s+.*from\s+['"]@\/.+['"]\s*;?\s*$/.test(line)) {
      return;
    }

    pushFinding(
      'style/alias-no-root-slash',
      filePath,
      `Line ${index + 1}: замените '@/...' на формат алиаса '@catalog_name/...'`,
    );
  });

  lines.forEach((line, index) => {
    if (!/^\s*import\s+.*['"]#shared\/.+['"]\s*;?\s*$/.test(line) && !/^\s*export\s+.*from\s+['"]#shared\/.+['"]\s*;?\s*$/.test(line)) {
      return;
    }

    pushFinding(
      'style/alias-no-shared-hash',
      filePath,
      `Line ${index + 1}: замените '#shared/...' на '@shared/...'`,
    );
  });
}

// Запускает ESLint через `node node_modules/eslint/bin/eslint.js`, чтобы не зависеть от `.bin` шимов Windows (ENOENT/EINVAL).
function runEslintAudit() {
  const eslintCli = resolve(repoRoot, 'node_modules/eslint/bin/eslint.js');
  const hasEslintFlatConfig =
    existsSync(resolve(repoRoot, 'eslint.config.js')) ||
    existsSync(resolve(repoRoot, 'eslint.config.mjs')) ||
    existsSync(resolve(repoRoot, 'eslint.config.cjs'));

  if (!existsSync(eslintCli)) {
    pushFinding('tooling/eslint-missing', resolve(repoRoot, 'package.json'), 'eslint binary is not installed');
    return;
  }

  if (!hasEslintFlatConfig) {
    return;
  }

  const eslintResult = spawnSync(process.execPath, [eslintCli, inputTarget], {
    cwd: repoRoot,
    encoding: 'utf-8',
  });

  if (eslintResult.status !== 0) {
    const output = `${eslintResult.stdout ?? ''}\n${eslintResult.stderr ?? ''}`.trim();
    pushFinding('eslint', targetPath, output || 'ESLint сообщил о проблемах');
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
      const isGlobalScss = normalizedPath.includes('/src/assets/scss/');
      const dir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
      const hasVueSibling = filePaths.some((fp) => {
        const np = fp.split(sep).join('/');

        return np.startsWith(dir + '/') && np.endsWith('.vue');
      });

      const isComponentScss = hasVueSibling;
      
      if (!isGlobalScss && !isComponentScss) {
        pushFinding('styles/global-scss-location', filePath, 'Global styles should live only in src/assets/scss/ or next to component');
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
            `Line ${index + 1}: добавьте пустую строку между объявлениями переменных и оператором if`,
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
              `Line ${index + 1}: используйте формат однострочного guard "if (condition) return ...;" для простых возвратов`,
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
              `Line ${index + 1}: оставьте сложный return в многострочном блоке if, не используйте однострочный guard`,
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
            `Line ${index + 1}: разверните вызов .map/.filter/... в многострочный формат "лестницы"`,
          );
        }

        if (/^\s*const\s+[^=]+=\s*(?:[A-Za-z_$][\w$.\]?]*|\([^)]*\))\.(map|filter|forEach|find|reduce)\(\s*\(/.test(trimmedLine)) {
          pushFinding(
            'style/chain-callback-newline',
            filePath,
            `Line ${index + 1}: начните аргументы callback на новой строке после value.method(`,
          );
        }

        if (index < lines.length - 1) {
          const nextTrimmedLine = lines[index + 1].trim();
          if (/^\s*\),\s*$/.test(trimmedLine) && /^\s*\);\s*$/.test(nextTrimmedLine)) {
            pushFinding(
              'style/chain-closing-same-line',
              filePath,
              `Line ${index + 1}: оставьте закрывающие скобки callback и метода на одной строке как "));"`,
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
              `Line ${index + 1}: для цепочек с несколькими методами переместите первый метод на новую строку`,
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
              `Line ${index + 1}: оставьте значение и одиночный вызов метода на одной строке (value.method()...)`,
            );
          }
        }
      }

      const hasLocalTypeDeclaration = /^\s*(?:export\s+)?(?:type\s+[A-Z]\w*\s*(?:=|<)|interface\s+[A-Z]\w*\s*(?:\{|<))/m.test(content);

      const isTypesFile = /(\.types\.ts|[\\/]types\.ts|[\\/]types[\\/]index\.ts|\.d\.ts)$/.test(filePath);
      
      if (!isTypesFile && hasLocalTypeDeclaration) {
        pushFinding('typing/types-location', filePath, 'Move type/interface declarations to *.types.ts or types.ts');
      }

      const hasUpperSnakeConstDeclaration = /^\s*const\s+[A-Z][A-Z0-9_]*\s*[:=]/m.test(content);
      const isConstantsFile = /(\.constants\.ts|[\\/]constants\.ts)$/.test(filePath);
      if (hasUpperSnakeConstDeclaration && !isConstantsFile) {
        pushFinding(
          'style/constants-location',
          filePath,
          'Move local UPPER_SNAKE const declarations to a nearby *.constants.ts file',
        );
      }

      const isTypesFileForReExportRule = /(\.types\.ts|[\\/]types\.ts|[\\/]types[\\/]index\.ts|\.d\.ts)$/.test(filePath);
      const isBarrelIndexFileForTypeReExportRule = /[\\/]index\.ts$/.test(filePath);
      if (!isTypesFileForReExportRule) {
        for (const typeReExportMatch of content.matchAll(/^\s*export\s+type(?:\s+\*|\s+\{)[^\n]*$/gm)) {
          const typeReExportLine = typeReExportMatch[0] ?? '';
          const isAllowedBarrelTypeStarReExport =
            isBarrelIndexFileForTypeReExportRule &&
            /^\s*export\s+type\s+\*\s+from\s+['"][^'"]+\.types['"]\s*;?\s*$/.test(typeReExportLine);

          if (isAllowedBarrelTypeStarReExport) {
            continue;
          }

          const lineNumber = getLineNumberByOffset(content, typeReExportMatch.index ?? 0);
          pushFinding(
            'typing/no-type-reexport-in-implementation-files',
            filePath,
            `Line ${lineNumber}: type-реэкспорт из файла реализации запрещён; импортируйте типы напрямую из *.types.ts`,
          );
        }
      }

      const inlineObjectInArrayPattern = /:\s*Array<\{\s*[\s\S]*?\s*\}>/g;
      for (const inlineArrayMatch of content.matchAll(inlineObjectInArrayPattern)) {
        const lineNumber = getLineNumberByOffset(content, inlineArrayMatch.index ?? 0);
        pushFinding(
          'typing/no-inline-object-array-generic',
          filePath,
          `Line ${lineNumber}: замените Array<{ ... }> на именованный тип/interface`,
        );
      }

      const inlineObjectInExportedReturnPattern =
        /export\s+(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\([^)]*\)\s*:\s*\{[\s\S]*?\}\s*\{/g;
      for (const inlineReturnMatch of content.matchAll(inlineObjectInExportedReturnPattern)) {
        const lineNumber = getLineNumberByOffset(content, inlineReturnMatch.index ?? 0);
        pushFinding(
          'typing/no-inline-object-exported-return',
          filePath,
          `Line ${lineNumber}: тип возврата экспортируемой функции должен использовать именованные типы вместо встроенного объекта`,
        );
      }

      if (filePath.endsWith('.ts')) {
        runExplicitVariableAnnotationHeuristics({
          filePath,
          lines,
          startLine: 0,
          endLine: lines.length,
        });
      }

      if (filePath.endsWith('.vue')) {
        const scriptSetupStart = lines.findIndex((line) => /^<script\s+setup\s+lang="ts"\s*>/.test(line.trim()));
        if (scriptSetupStart >= 0) {
          const scriptSetupEnd = lines.findIndex(
            (line, index) => index > scriptSetupStart && /^<\/script>/.test(line.trim()),
          );
          if (scriptSetupEnd > scriptSetupStart) {
            runExplicitVariableAnnotationHeuristics({
              filePath,
              lines,
              startLine: scriptSetupStart + 1,
              endLine: scriptSetupEnd,
            });
          }
        }
      }

      runAdditionalStyleHeuristics({
        content,
        filePath,
        lines,
      });
      runNuxtHeuristics({
        content,
        filePath,
        lines,
      });
      runComposableHeuristics({
        filePath,
        lines,
      });
      runImportMergeHeuristics({
        filePath,
        lines,
      });
      if (filePath.endsWith('.vue')) {
        runVueStyleImportHeuristics({
          content,
          filePath,
          lines,
        });
      }
    }
  }
}

// Печатает итоговый отчет по найденным нарушениям, сгруппированный по имени правила.
function printReport() {
  console.log(`Целевая директория для аудита правил: ${inputTarget}`);
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
