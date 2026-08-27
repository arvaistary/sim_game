<template>
  <GameLayout
    title="Итоги жизни"
    :show-nav="false"
  >
    <main class="end-page">
      <EmptyState
        v-if="!summary"
        text="Итоговый отчёт пока недоступен."
      />

      <template v-else>
        <section
          class="end-page__hero"
          aria-labelledby="life-ending-title"
        >
          <p class="end-page__eyebrow">Жизнь завершена</p>
          <h1
            id="life-ending-title"
            class="end-page__title"
          >
            {{ summary.endingTitle }}
          </h1>
          <p class="end-page__subtitle">
            {{ summary.playerName }} прожил {{ summary.ageAtDeath }} лет.
            Причина: {{ summary.deathCauseLabel }}.
          </p>
          <div class="end-page__score">
            <span
              class="end-page__stars"
              :aria-label="`Рейтинг: ${summary.score.stars} из 5`"
            >
              {{ '★'.repeat(summary.score.stars) }}{{ '☆'.repeat(5 - summary.score.stars) }}
            </span>
            <strong>{{ summary.score.total }} / 18</strong>
            <span>итоговых очков</span>
          </div>
        </section>

        <div class="end-page__grid">
          <RoundedPanel>
            <h2>Основные данные</h2>
            <dl class="end-page__metrics">
              <div><dt>Продолжительность</dt><dd>{{ summary.gameDays }} дней</dd></div>
              <div><dt>Возраст</dt><dd>{{ summary.ageAtDeath }} лет</dd></div>
              <div><dt>Причина смерти</dt><dd>{{ summary.deathCauseLabel }}</dd></div>
            </dl>
          </RoundedPanel>

          <RoundedPanel>
            <h2>Финансы</h2>
            <dl class="end-page__metrics">
              <div><dt>Состояние</dt><dd>{{ formatMoney(summary.finance.moneyAtDeath) }} ₽</dd></div>
              <div><dt>Максимальный капитал</dt><dd>{{ formatMoney(summary.finance.maxMoney) }} ₽</dd></div>
              <div><dt>Заработано</dt><dd>{{ formatMoney(summary.finance.totalEarnings) }} ₽</dd></div>
              <div><dt>Потрачено</dt><dd>{{ formatMoney(summary.finance.totalSpent) }} ₽</dd></div>
            </dl>
          </RoundedPanel>

          <RoundedPanel>
            <h2>Карьера</h2>
            <dl class="end-page__metrics">
              <div><dt>Высшая должность</dt><dd>{{ summary.career.highestJob }}</dd></div>
              <div><dt>Максимальная зарплата</dt><dd>{{ formatMoney(summary.career.maxSalaryPerWeek) }} ₽ / нед.</dd></div>
              <div><dt>Повышения</dt><dd>{{ summary.career.promotions }}</dd></div>
              <div><dt>Рабочие дни</dt><dd>{{ summary.career.totalWorkDays }}</dd></div>
            </dl>
          </RoundedPanel>

          <RoundedPanel>
            <h2>Отношения и дом</h2>
            <dl class="end-page__metrics">
              <div><dt>Браки</dt><dd>{{ summary.family.marriages }}</dd></div>
              <div><dt>Дети</dt><dd>{{ summary.family.childrenCount }}</dd></div>
              <div><dt>Максимальная близость</dt><dd>{{ summary.family.maxRelationshipLevel }}</dd></div>
              <div><dt>Комфорт дома</dt><dd>{{ summary.housing.comfortAtDeath }}</dd></div>
            </dl>
          </RoundedPanel>

          <RoundedPanel>
            <h2>Лучшие навыки</h2>
            <ol
              v-if="summary.topSkills.length"
              class="end-page__skills"
            >
              <li
                v-for="skill in summary.topSkills"
                :key="skill.id"
              >
                <span>{{ skill.id }}</span>
                <strong>{{ skill.level }}</strong>
              </li>
            </ol>
            <p
              v-else
              class="end-page__muted"
            >Навыки не развивались.</p>
          </RoundedPanel>

          <RoundedPanel>
            <h2>Достижения и увлечения</h2>
            <dl class="end-page__metrics">
              <div><dt>Достижения</dt><dd>{{ summary.achievements }}</dd></div>
              <div><dt>Освоенные хобби</dt><dd>{{ summary.hobbies.mastered }}</dd></div>
              <div><dt>Коллекции</dt><dd>{{ summary.hobbies.collections }}</dd></div>
              <div><dt>Предметы</dt><dd>{{ summary.possessions }}</dd></div>
            </dl>
          </RoundedPanel>
        </div>

        <div class="end-page__actions">
          <GameButton
            variant="primary"
            label="Начать новую жизнь"
            @click="startNewGame"
          />
          <GameButton
            variant="secondary"
            label="Экспортировать отчёт"
            @click="exportSummary"
          />
          <GameButton
            variant="secondary"
            label="Новая игра+"
            @click="startNewGamePlus"
          />
        </div>
      </template>
    </main>
  </GameLayout>
</template>

<script setup lang="ts">
import './end.scss'
import type { ComputedRef } from 'vue'
import type { LifeSummary } from '@/domain/game-world/life'
import { formatMoney } from '@/utils/format'

definePageMeta({ middleware: ['game-init'] })

const gameStore = useGameStore()

const summary: ComputedRef<LifeSummary | null> = computed(() => gameStore.lifeSummary)

const { startNewGame, startNewGamePlus } = useNewGame()

function exportSummary(): void {
  if (!summary.value) return

  const blob: Blob = new Blob([JSON.stringify(summary.value, null, 2)], { type: 'application/json' })
  const url: string = URL.createObjectURL(blob)
  const anchor: HTMLAnchorElement = document.createElement('a')
  anchor.href = url
  anchor.download = `game-life-${summary.value.playerName || 'life'}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>
