import type {
  EventIngressDTO,
  EventIngressResult,
  EventPriority,
  TimeSnapshot,
} from '@/domain/engine/types'

/**
 * Генератор детерминированных instanceId
 * Формат: {templateId}_{totalHours}_{sequence}
 */
export class InstanceIdGenerator {
  private sequenceCounters = new Map<string, number>()

  /**
   * Генерирует детерминированный instanceId
   * @param templateId - ID шаблона события
   * @param totalHours - Общее количество часов в игре
   * @returns Детерминированный instanceId
   */
  generate(templateId: string, totalHours: number): string {
    const key = `${templateId}_${totalHours}`
    const sequence = (this.sequenceCounters.get(key) || 0) + 1
    this.sequenceCounters.set(key, sequence)
    return `${templateId}_${totalHours}_${sequence}`
  }

  /**
   * Сбрасывает счётчики (для тестов)
   */
  reset(): void {
    this.sequenceCounters.clear()
  }
}

/**
 * Приоритеты событий для сортировки
 */
const PRIORITY_ORDER: Record<EventPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}

/**
 * EventIngress API - единая точка входа для событий
 */
export class EventIngress {
  private instanceIdGenerator = new InstanceIdGenerator()

  /**
   * Нормализует DTO события перед добавлением в очередь
   * @param dto - Входной DTO
   * @returns Нормализованный DTO или null при ошибке
   */
  normalize(dto: EventIngressDTO): EventIngressDTO | null {
    // Валидация обязательных полей
    if (!dto.templateId || !dto.timeSnapshot || !dto.title) {
      return null
    }

    // Нормализация choices
    const normalizedChoices = dto.choices?.map((choice, index) => ({
      id: choice.id || `choice_${index}`,
      text: choice.text || 'Вариант',
      effects: choice.effects || {},
      outcome: choice.outcome || '',
      skillCheck: choice.skillCheck,
    }))

    return {
      ...dto,
      priority: dto.priority || 'normal',
      choices: normalizedChoices,
      meta: dto.meta || {},
    }
  }

  /**
   * Генерирует или возвращает существующий instanceId
   * @param dto - Нормализованный DTO
   * @returns instanceId
   */
  resolveInstanceId(dto: EventIngressDTO): string {
    if (dto.instanceId) {
      return dto.instanceId
    }
    return this.instanceIdGenerator.generate(
      dto.templateId,
      dto.timeSnapshot.totalHours,
    )
  }

  /**
   * Преобразует DTO в EventQueueItem
   * @param dto - Нормализованный DTO с instanceId
   * @returns EventQueueItem
   */
  toQueueItem(dto: EventIngressDTO): Record<string, unknown> {
    return {
      id: dto.templateId,
      instanceId: this.resolveInstanceId(dto),
      type: dto.type,
      title: dto.title,
      description: dto.description,
      choices: dto.choices,
      data: dto.meta,
      day: dto.timeSnapshot.day,
      week: dto.timeSnapshot.week,
      month: dto.timeSnapshot.month,
      year: dto.timeSnapshot.year,
      _priority: dto.priority,
      _source: dto.source,
    }
  }

  /**
   * Сравнивает приоритеты двух событий
   * @param a - Первое событие
   * @param b - Второе событие
   * @returns -1 если a имеет больший приоритет, 1 если b, 0 если равны
   */
  comparePriority(a: Record<string, unknown>, b: Record<string, unknown>): number {
    const priorityA = (a._priority as EventPriority) || 'normal'
    const priorityB = (b._priority as EventPriority) || 'normal'
    return PRIORITY_ORDER[priorityA] - PRIORITY_ORDER[priorityB]
  }

  /**
   * Создаёт результат успешного добавления
   * @param instanceId - ID инстанса события
   * @returns Результат
   */
  accepted(instanceId: string): EventIngressResult {
    return { status: 'accepted', instanceId }
  }

  /**
   * Создаёт результат отклонения (дубликат)
   * @param instanceId - ID инстанса события
   * @param reason - Причина отклонения
   * @returns Результат
   */
  rejectedDuplicate(instanceId: string, reason: string): EventIngressResult {
    return { status: 'rejected_duplicate', instanceId, reason }
  }

  /**
   * Создаёт результат отклонения (невалидный payload)
   * @param reason - Причина отклонения
   * @returns Результат
   */
  rejectedInvalid(reason: string): EventIngressResult {
    return { status: 'rejected_invalid_payload', reason }
  }

  /**
   * Сбрасывает состояние генератора (для тестов)
   */
  reset(): void {
    this.instanceIdGenerator.reset()
  }
}
