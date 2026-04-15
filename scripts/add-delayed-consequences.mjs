/**
 * Скрипт для добавления delayedConsequences в выборы детских событий.
 * Использование: node scripts/add-delayed-consequences.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const eventsDir = resolve(__dirname, '../src/domain/balance/constants/childhood-events')

const files = ['infant-events.ts', 'preschool-events.ts', 'school-events.ts', 'teen-events.ts', 'young-events.ts']

const templates = {
  infant: [
    { yearsLater: 18, desc: 'Это раннее воспоминание до сих пор влияет на тебя.', mood: 5 },
    { yearsLater: 25, desc: 'Ты совсем не помнишь этот момент. Но он сформировал тебя.', mood: -3 },
  ],
  preschool: [
    { yearsLater: 15, desc: 'Ты иногда вспоминаешь этот день. Странное чувство.', mood: 5 },
    { yearsLater: 20, desc: 'Это воспоминание из другого мира. Ты был другим человеком.', mood: 3 },
    { yearsLater: 12, desc: 'Мама до сих пор рассказывает эту историю.', mood: 8 },
  ],
  school: [
    { yearsLater: 15, desc: 'Школьные годы... Иногда ты скучаешь по ним.', mood: 5 },
    { yearsLater: 20, desc: 'Этот выбор научил тебя чему-то. Ты не помнишь чему именно.', mood: -3 },
    { yearsLater: 10, desc: 'Ты встретил одноклассника. Вспомнили этот случай.', mood: 10 },
  ],
  teen: [
    { yearsLater: 10, desc: 'Подростковые годы... Ты был таким другим.', mood: 3 },
    { yearsLater: 15, desc: 'Этот выбор до сих пор определяет кто ты.', mood: -5 },
    { yearsLater: 8, desc: 'Ты иногда думаешь — что если бы выбрал иначе?', mood: -3 },
  ],
  young: [
    { yearsLater: 10, desc: 'Последние годы школы. Ты стал взрослее. Или нет?', mood: 5 },
    { yearsLater: 15, desc: 'Этот момент определил твою жизнь. Ты знаешь это теперь.', mood: -5 },
    { yearsLater: 5, desc: 'Прошло всего 5 лет. А кажется — целая жизнь.', mood: 3 },
  ],
}

let grandTotalAdded = 0
let grandTotalChoices = 0
let grandTotalWithDC = 0

for (const file of files) {
  const filePath = resolve(eventsDir, file)
  let content = readFileSync(filePath, 'utf-8')
  const category = file.replace('-events.ts', '')
  const tmpl = templates[category] || templates.school

  const choicesBefore = (content.match(/label:/g) || []).length
  const dcBefore = (content.match(/delayedConsequences:/g) || []).length

  // Collect existing memoryIds
  const existingIds = new Set()
  const re = /memoryId:\s*'([^']+)'/g
  let m
  while ((m = re.exec(content)) !== null) existingIds.add(m[1])

  const lines = content.split('\n')
  const out = []
  let inChoice = false
  let hasDC = false
  let choiceIdx = 0
  let curEventId = ''
  let added = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const tr = line.trim()

    const evMatch = line.match(/^\s+id:\s*'([^']+)'/)
    if (evMatch) curEventId = evMatch[1]

    if (line.match(/^\s+label:\s*'/)) {
      inChoice = true
      hasDC = false
      choiceIdx++
    }

    if (inChoice && tr.startsWith('delayedConsequences:')) {
      hasDC = true
    }

    // Detect choice end: line is exactly "      }," (6 spaces + },)
    if (inChoice && /^\s{6}\},\s*$/.test(line)) {
      if (!hasDC) {
        const t = tmpl[choiceIdx % tmpl.length]
        let memId = `${curEventId}_dc${choiceIdx}`
        let sfx = 1
        while (existingIds.has(memId)) { memId = `${curEventId}_dc${choiceIdx}_${sfx}`; sfx++ }
        existingIds.add(memId)

        out.push(`        delayedConsequences: [`)
        out.push(`          { yearsLater: ${t.yearsLater}, description: '${t.desc}', statChanges: { mood: ${t.mood} }, memoryId: '${memId}' },`)
        out.push(`        ],`)
        added++
      }
      inChoice = false
    }

    out.push(line)
  }

  const newContent = out.join('\n')
  const choicesAfter = (newContent.match(/label:/g) || []).length
  const dcAfter = (newContent.match(/delayedConsequences:/g) || []).length

  if (choicesAfter !== choicesBefore) {
    console.error(`ERROR: ${file} choice count changed ${choicesBefore} -> ${choicesAfter}, skipping write`)
    continue
  }

  writeFileSync(filePath, newContent, 'utf-8')
  console.log(`${file}: ${dcBefore} -> ${dcAfter} delayedConsequences (${choicesBefore} choices, ${Math.round(dcAfter / choicesBefore * 100)}%)`)
  grandTotalAdded += added
  grandTotalChoices += choicesBefore
  grandTotalWithDC += dcAfter
}

console.log(`\nTotal added: ${grandTotalAdded}`)
console.log(`Coverage: ${grandTotalWithDC}/${grandTotalChoices} = ${Math.round(grandTotalWithDC / grandTotalChoices * 100)}%`)
