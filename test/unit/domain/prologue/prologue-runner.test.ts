import { describe, expect, test } from 'vitest'
import {
  choosePrologueOption,
  completePrologue,
  resumePrologue,
  selectPrologueTrack,
  startPrologue,
  submitPrologueExam,
} from '@/domain/prologue/prologue-runner'
import { buildPrologueHandoffPatch } from '@/domain/prologue/handoff'
import type { PrologueState } from '@/domain/prologue/prologue.types'

function playUntil(status: PrologueState['status'], track: 'tech' | 'uni' | null = null): PrologueState {
  let state: PrologueState = startPrologue({ playerName: 'Тест', seed: 42 })

  let guard: number = 0
  while (state.status !== status && state.status !== 'completed' && guard < 200) {
    guard += 1

    if (state.status === 'fork') {
      if (!track) break
      state = selectPrologueTrack(state, track)
      continue
    }

    if (state.status === 'school_exam' || state.status === 'postsec_exam') {
      state = submitPrologueExam(state, 5)
      continue
    }

    if (state.pendingScene) {
      state = choosePrologueOption(state, 0)
      continue
    }

    state = resumePrologue(state)
  }

  return state
}

describe('prologue runner', () => {
  test('school → uni path reaches summary with both multipliers', () => {
    const state: PrologueState = playUntil('summary', 'uni')

    expect(state.status).toBe('summary')
    expect(state.track).toBe('uni')
    expect(state.mSchool).not.toBeNull()
    expect(state.mPostsec).not.toBeNull()
    expect(state.seenSceneIds.length).toBeGreaterThan(0)
  })

  test('school → tech path reaches summary', () => {
    const state: PrologueState = playUntil('summary', 'tech')

    expect(state.status).toBe('summary')
    expect(state.track).toBe('tech')
  })

  test('fork is mandatory — cannot skip to postsec without track', () => {
    const atFork: PrologueState = playUntil('fork')
    expect(atFork.status).toBe('fork')
    expect(atFork.track).toBeNull()

    const unchanged: PrologueState = submitPrologueExam(atFork, 5)
    expect(unchanged.status).toBe('fork')
  })

  test('resume mid-run restores pending scene', () => {
    let state: PrologueState = startPrologue({ playerName: 'Тест', seed: 7 })
    expect(state.pendingScene).not.toBeNull()

    state = choosePrologueOption(state, 0)
    const withoutPending: PrologueState = { ...state, pendingScene: null }
    const resumed: PrologueState = resumePrologue(withoutPending)

    expect(resumed.pendingScene).not.toBeNull()
  })

  test('handoff age is 18 and education follows track', () => {
    const uniState: PrologueState = playUntil('summary', 'uni')
    const patch = buildPrologueHandoffPatch(uniState)

    expect(patch.currentAge).toBe(18)
    expect(patch.startAge).toBe(18)
    expect(patch.educationLevel).toBe('Высшее')
    expect(patch.institute).toBe('completed')
    expect(patch.prologueCompleted).toBe(true)

    const completed: PrologueState = completePrologue(uniState)
    expect(completed.prologueCompleted).toBe(true)
  })
})
