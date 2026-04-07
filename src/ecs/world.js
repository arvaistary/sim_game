/**
 * ECS World - контейнер для сущностей, компонентов и систем
 */
export class ECSWorld {
  constructor() {
    this.entities = new Map();
    this.components = new Map();
    this.systems = [];
    this.nextEntityId = 0;
    this.eventBus = new EventTarget();
  }

  /**
   * Создать новую сущность
   */
  createEntity() {
    const id = `entity_${this.nextEntityId++}`;
    this.entities.set(id, { id, components: new Set() });
    return id;
  }

  /**
   * Удалить сущность
   */
  destroyEntity(entityId) {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    // Удаляем все компоненты сущности
    entity.components.forEach(componentKey => {
      const componentMap = this.components.get(componentKey);
      if (componentMap) {
        componentMap.delete(entityId);
      }
    });

    this.entities.delete(entityId);
  }

  /**
   * Добавить компонент к сущности
   */
  addComponent(entityId, componentKey, data = {}) {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    if (!this.components.has(componentKey)) {
      this.components.set(componentKey, new Map());
    }

    const componentMap = this.components.get(componentKey);
    componentMap.set(entityId, { ...data });
    entity.components.add(componentKey);
  }

  /**
   * Получить компонент сущности
   */
  getComponent(entityId, componentKey) {
    const componentMap = this.components.get(componentKey);
    if (!componentMap) return null;
    return componentMap.get(entityId) || null;
  }

  /**
   * Обновить компонент сущности
   */
  updateComponent(entityId, componentKey, updates) {
    const component = this.getComponent(entityId, componentKey);
    if (!component) return;

    const componentMap = this.components.get(componentKey);
    componentMap.set(entityId, { ...component, ...updates });
  }

  /**
   * Удалить компонент сущности
   */
  removeComponent(entityId, componentKey) {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    const componentMap = this.components.get(componentKey);
    if (componentMap) {
      componentMap.delete(entityId);
    }
    entity.components.delete(componentKey);
  }

  /**
   * Получить все сущности с указанными компонентами
   */
  queryEntities(...componentKeys) {
    const results = [];
    for (const [entityId, entity] of this.entities) {
      const hasAll = componentKeys.every(key => entity.components.has(key));
      if (hasAll) {
        results.push(entityId);
      }
    }
    return results;
  }

  /**
   * Получить данные компонентов для сущности
   */
  getEntityComponents(entityId, componentKeys) {
    const result = {};
    for (const key of componentKeys) {
      result[key] = this.getComponent(entityId, key);
    }
    return result;
  }

  /**
   * Добавить систему
   */
  addSystem(system) {
    this.systems.push(system);
    if (system.init) {
      system.init(this);
    }
  }

  /**
   * Удалить систему
   */
  removeSystem(system) {
    const index = this.systems.indexOf(system);
    if (index > -1) {
      this.systems.splice(index, 1);
    }
  }

  /**
   * Обновить все системы
   */
  update(deltaTime) {
    for (const system of this.systems) {
      if (system.update) {
        system.update(this, deltaTime);
      }
    }
  }

  /**
   * Получить систему по типу
   */
  getSystem(SystemClass) {
    return this.systems.find(s => s instanceof SystemClass) || null;
  }

  /**
   * Очистить мир
   */
  clear() {
    this.entities.clear();
    this.components.clear();
    this.systems = [];
    this.nextEntityId = 0;
  }

  /**
   * Сериализация мира в JSON
   */
  toJSON() {
    const entitiesData = [];
    for (const [entityId, entity] of this.entities) {
      const entityData = { id: entityId, components: {} };
      for (const componentKey of entity.components) {
        entityData.components[componentKey] = this.getComponent(entityId, componentKey);
      }
      entitiesData.push(entityData);
    }
    return {
      entities: entitiesData,
      nextEntityId: this.nextEntityId
    };
  }

  /**
   * Десериализация мира из JSON
   */
  fromJSON(data) {
    this.clear();
    this.nextEntityId = data.nextEntityId || 0;

    for (const entityData of data.entities || []) {
      const entityId = this.createEntity();
      // Создаем сущность с правильным ID
      this.entities.delete(entityId);
      this.entities.set(entityData.id, {
        id: entityData.id,
        components: new Set()
      });

      // Добавляем компоненты
      for (const [componentKey, componentData] of Object.entries(entityData.components || {})) {
        this.addComponent(entityData.id, componentKey, componentData);
      }
    }

    // Обновляем счетчик, если нужно
    if (data.nextEntityId > this.nextEntityId) {
      this.nextEntityId = data.nextEntityId;
    }
  }
}
