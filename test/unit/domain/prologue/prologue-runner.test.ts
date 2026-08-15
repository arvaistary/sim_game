import { describe, expect, test } from 'vitest'
import {
  choosePrologueOption,
  completePrologueMicrobeat,
  completePrologue,
  resumePrologue,
  selectPrologueTrack,
  startPrologue,
  submitPrologueExam,
} from '@/domain/prologue/prologue-runner'
import { buildPrologueHandoffPatch } from '@/domain/prologue/handoff'
import type { PrologueHandoffPatch, PrologueState } from '@/domain/prologue/prologue.types'

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

    if (state.pendingMicrobeat) {
      state = completePrologueMicrobeat(state, {
        minigameId: state.pendingMicrobeat.minigameId,
        successTier: 'great',
        score01: 1,
      })
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

  test('optional microbeat pauses the term and applies its reward once', () => {
    let state: PrologueState = startPrologue({ playerName: 'Тест', seed: 42 })
    let microbeatState: PrologueState | null = null

    for (let attempt: number = 0; attempt < 100; attempt += 1) {
      if (state.pendingMicrobeat) {
        microbeatState = state
        break
      }

      if (state.pendingScene) {
        state = choosePrologueOption(state, 0)
        continue
      }

      state = resumePrologue(state)
    }

    expect(microbeatState).not.toBeNull()

    const pending: PrologueState = microbeatState!
    const failed: PrologueState = completePrologueMicrobeat(pending, {
      minigameId: pending.pendingMicrobeat!.minigameId,
      successTier: 'fail',
      score01: 0,
    })

    expect(failed.tagPoints).toEqual(pending.tagPoints)
    expect(failed.pendingMicrobeat).toBeNull()

    const completed: PrologueState = completePrologueMicrobeat(pending, {
      minigameId: pending.pendingMicrobeat!.minigameId,
      successTier: 'great',
      score01: 1,
    })

    expect(completed.pendingMicrobeat).toBeNull()
    expect(completed.termIndex).toBeGreaterThan(pending.termIndex)
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

  test('invalid scene choice does not skip the pending scene', () => {
    const state: PrologueState = startPrologue({ playerName: 'Тест', seed: 7 })

    const negativeIndex: PrologueState = choosePrologueOption(state, -1)
    const outOfRangeIndex: PrologueState = choosePrologueOption(state, state.pendingScene!.choices.length)

    expect(negativeIndex).toEqual(state)
    expect(outOfRangeIndex).toEqual(state)
  })

  test('handoff age is 18 and education follows track', () => {
    const uniState: PrologueState = playUntil('summary', 'uni')
    const patch: PrologueHandoffPatch = buildPrologueHandoffPatch(uniState)

    expect(patch.currentAge).toBe(18)
    expect(patch.startAge).toBe(18)
    expect(patch.educationLevel).toBe('Высшее')
    expect(patch.institute).toBe('completed')
    expect(patch.prologueCompleted).toBe(true)

    const completed: PrologueState = completePrologue(uniState)
    expect(completed.prologueCompleted).toBe(true)
  })
})
