/**
 * GameWorld - контейнер для сущностей, компонентов и систем
 * TypeScript версия
 */
import type { ComponentDataMap, ComponentKey, Entity, GameSystem } from './types'
import { LEGACY_TO_CANONICAL_KEY, CANONICAL_TO_LEGACY_KEY } from './constants/component-keys'

export class GameWorld {
  entities: Map<string, Entity> = new Map()
  components: Map<string, Map<string, Record<string, unknown>>> = new Map()
  systems: GameSystem[] = []
  nextEntityId = 0
  eventBus: EventTarget = new EventTarget()

  /**
   * Создать новую сущность
   */
  createEntity(): string {
    const id = `entity_${this.nextEntityId++}`
    this.entities.set(id, { id, components: new Set() })
    return id
  }

  /**
   * Удалить сущность
   */
  destroyEntity(entityId: string): void {
    const entity = this.entities.get(entityId)
    if (!entity) return

    // Удаляем все компоненты сущности
    entity.components.forEach(componentKey => {
      const componentMap = this.components.get(componentKey)
      if (componentMap) {
        componentMap.delete(entityId)
      }
    })

    this.entities.delete(entityId)
  }

  /**
   * Добавить компонент к сущности
   */
  addComponent(entityId: string, componentKey: string, data: Record<string, unknown> = {}): void {
    const normalizedKey = this.normalizeComponentKey(componentKey)
    const entity = this.entities.get(entityId)
    if (!entity) return

    if (!this.components.has(normalizedKey)) {
      this.components.set(normalizedKey, new Map())
    }

    const componentMap = this.components.get(normalizedKey)!
    componentMap.set(entityId, { ...data })
    entity.components.add(normalizedKey as ComponentKey)
  }

  /**
   * Получить компонент сущности
   */
  getComponent<T = Record<string, unknown>>(entityId: string, componentKey: string): T | null {
    const normalizedKey = this.normalizeComponentKey(componentKey)
    const componentMap = this.components.get(normalizedKey)
    if (!componentMap) return null
    return (componentMap.get(entityId) as T) || null
  }

  /**
   * Обновить компонент сущности
   */
  updateComponent(entityId: string, componentKey: string, updates: Record<string, unknown>): void {
    const normalizedKey = this.normalizeComponentKey(componentKey)
    const component = this.getComponent(entityId, componentKey)
    if (!component) return

    const componentMap = this.components.get(normalizedKey)
    if (componentMap) {
      componentMap.set(entityId, { ...component, ...updates })
    }
  }

  /**
   * Удалить компонент сущности
   */
  removeComponent(entityId: string, componentKey: string): void {
    const normalizedKey = this.normalizeComponentKey(componentKey)
    const entity = this.entities.get(entityId)
    if (!entity) return

    const componentMap = this.components.get(normalizedKey)
    if (componentMap) {
      componentMap.delete(entityId)
    }
    entity.components.delete(normalizedKey as ComponentKey)
  }

  /**
   * Получить все сущности с указанными компонентами
   */
  queryEntities(...componentKeys: string[]): string[] {
    const results: string[] = []
    const normalizedKeys = componentKeys.map(key => this.normalizeComponentKey(key))
    for (const [entityId, entity] of this.entities) {
      const hasAll = normalizedKeys.every(key => entity.components.has(key as ComponentKey))
      if (hasAll) {
        results.push(entityId)
      }
    }
    return results
  }

  /**
   * Получить данные компонентов для сущности
   */
  getEntityComponents(entityId: string, componentKeys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const key of componentKeys) {
      result[key] = this.getComponent(entityId, key)
    }
    return result
  }

  /**
   * Добавить систему
   */
  addSystem(system: GameSystem): void {
    this.systems.push(system)
    if (system.init) {
      system.init(this)
    }
  }

  /**
   * Удалить систему
   */
  removeSystem(system: GameSystem): void {
    const index = this.systems.indexOf(system)
    if (index > -1) {
      this.systems.splice(index, 1)
    }
  }

  /**
   * Обновить все системы
   */
  update(deltaTime: number): void {
    for (const system of this.systems) {
      if (system.update) {
        system.update(this, deltaTime)
      }
    }
  }

  /**
   * Получить систему по классу
   */
  getSystem<T extends GameSystem>(SystemClass: new (...args: unknown[]) => T): T | null {
    return (this.systems.find(s => s instanceof SystemClass) as T) || null
  }

  /**
   * Очистить мир
   */
  clear(): void {
    this.entities.clear()
    this.components.clear()
    this.systems = []
    this.nextEntityId = 0
  }

  /**
   * Сериализация мира в JSON
   */
  toJSON(): { entities: Array<{ id: string; components: Record<string, unknown> }>; nextEntityId: number } {
    const entitiesData: Array<{ id: string; components: Record<string, unknown> }> = []
    for (const [entityId, entity] of this.entities) {
      const entityData: { id: string; components: Record<string, unknown> } = { id: entityId, components: {} }
      for (const componentKey of entity.components) {
        const legacyKey = this.toLegacyComponentKey(componentKey)
        entityData.components[legacyKey] = this.getComponent(entityId, componentKey)
      }
      entitiesData.push(entityData)
    }
    return {
      entities: entitiesData,
      nextEntityId: this.nextEntityId,
    }
  }

  /**
   * Десериализация мира из JSON
   */
  fromJSON(data: { entities?: Array<{ id: string; components: Record<string, unknown> }>; nextEntityId?: number }): void {
    this.clear()
    this.nextEntityId = data.nextEntityId || 0

    for (const entityData of data.entities || []) {
      // Создаем сущность с правильным ID
      this.entities.set(entityData.id, {
        id: entityData.id,
        components: new Set(),
      })

      // Добавляем компоненты
      for (const [componentKey, componentData] of Object.entries(entityData.components || {})) {
        this.addComponent(entityData.id, componentKey, componentData as Record<string, unknown>)
      }
    }

    // Обновляем счетчик, если нужно
    if ((data.nextEntityId || 0) > this.nextEntityId) {
      this.nextEntityId = data.nextEntityId!
    }
  }

  emitDomainEvent<T = unknown>(type: string, payload: T): void {
    this.eventBus.dispatchEvent(new CustomEvent(type, { detail: payload }))
  }

  onDomainEvent<T = unknown>(type: string, listener: (payload: T) => void): () => void {
    const handler = (event: Event): void => {
      const customEvent = event as CustomEvent<T>
      listener(customEvent.detail)
    }
    this.eventBus.addEventListener(type, handler)
    return (): void => {
      this.eventBus.removeEventListener(type, handler)
    }
  }

  addTypedComponent<K extends ComponentKey>(entityId: string, componentKey: K, data: ComponentDataMap[K]): void {
    this.addComponent(entityId, componentKey, data as unknown as Record<string, unknown>)
  }

  getTypedComponent<K extends ComponentKey>(entityId: string, componentKey: K): ComponentDataMap[K] | null {
    return this.getComponent<ComponentDataMap[K]>(entityId, componentKey)
  }

  updateTypedComponent<K extends ComponentKey>(entityId: string, componentKey: K, updates: Partial<ComponentDataMap[K]>): void {
    this.updateComponent(entityId, componentKey, updates as unknown as Record<string, unknown>)
  }

  normalizeComponentKey(componentKey: string): string {
    return LEGACY_TO_CANONICAL_KEY[componentKey] ?? componentKey
  }

  toLegacyComponentKey(componentKey: string): string {
    return CANONICAL_TO_LEGACY_KEY[componentKey] ?? componentKey
  }
}

