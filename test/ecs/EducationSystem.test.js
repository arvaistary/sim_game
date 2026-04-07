import { ECSWorld } from '../../src/ecs/world.js';
import { EducationSystem } from '../../src/ecs/systems/EducationSystem.js';
import { StatsSystem } from '../../src/ecs/systems/StatsSystem.js';

describe('EducationSystem', () => {
  let world;
  let educationSystem;
  let statsSystem;
  let playerEntityId;

  beforeEach(() => {
    world = new ECSWorld();
    statsSystem = new StatsSystem();
    statsSystem.init(world);
    educationSystem = new EducationSystem();
    educationSystem.init(world);
    
    playerEntityId = world.createEntity();
    world.addComponent(playerEntityId, 'stats', {
      energy: 80,
      stress: 30,
      health: 90,
      mood: 70
    });
    world.addComponent(playerEntityId, 'education', {
      activeCourses: [],
      completedCourses: []
    });
  });

  describe('enrollInCourse', () => {
    it('должен добавлять курс в активные курсы', () => {
      const course = {
        id: 'programming_basics',
        name: 'Основы программирования',
        durationDays: 7,
        energyCost: 15,
        stressCost: 5,
        reward: { skill: 'programming', value: 10 }
      };
      
      educationSystem.enrollInCourse(playerEntityId, course);
      
      const education = world.getComponent(playerEntityId, 'education');
      expect(education.activeCourses).toHaveLength(1);
      expect(education.activeCourses[0].id).toBe('programming_basics');
    });

    it('должен инициализировать прогресс курса', () => {
      const course = {
        id: 'programming_basics',
        name: 'Основы программирования',
        durationDays: 7,
        energyCost: 15,
        stressCost: 5,
        reward: { skill: 'programming', value: 10 }
      };
      
      educationSystem.enrollInCourse(playerEntityId, course);
      
      const education = world.getComponent(playerEntityId, 'education');
      expect(education.activeCourses[0].progress).toBe(0);
      expect(education.activeCourses[0].daysRemaining).toBe(7);
    });

    it('должен уменьшать энергию при записи на курс', () => {
      const course = {
        id: 'programming_basics',
        name: 'Основы программирования',
        durationDays: 7,
        energyCost: 15,
        stressCost: 5,
        reward: { skill: 'programming', value: 10 }
      };
      
      const initialEnergy = world.getComponent(playerEntityId, 'stats').energy;
      educationSystem.enrollInCourse(playerEntityId, course);
      
      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.energy).toBe(initialEnergy - 15);
    });

    it('должен увеличивать стресс при записи на курс', () => {
      const course = {
        id: 'programming_basics',
        name: 'Основы программирования',
        durationDays: 7,
        energyCost: 15,
        stressCost: 5,
        reward: { skill: 'programming', value: 10 }
      };
      
      const initialStress = world.getComponent(playerEntityId, 'stats').stress;
      educationSystem.enrollInCourse(playerEntityId, course);
      
      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.stress).toBe(initialStress + 5);
    });
  });

  describe('studyCourse', () => {
    beforeEach(() => {
      const course = {
        id: 'programming_basics',
        name: 'Основы программирования',
        durationDays: 7,
        energyCost: 15,
        stressCost: 5,
        reward: { skill: 'programming', value: 10 }
      };
      
      educationSystem.enrollInCourse(playerEntityId, course);
    });

    it('должен увеличивать прогресс курса', () => {
      const education = world.getComponent(playerEntityId, 'education');
      const initialProgress = education.activeCourses[0].progress;
      
      educationSystem.studyCourse(playerEntityId, 'programming_basics');
      
      const updatedEducation = world.getComponent(playerEntityId, 'education');
      expect(updatedEducation.activeCourses[0].progress).toBe(initialProgress + 1);
    });

    it('должен уменьшать оставшиеся дни', () => {
      const education = world.getComponent(playerEntityId, 'education');
      const initialDaysRemaining = education.activeCourses[0].daysRemaining;
      
      educationSystem.studyCourse(playerEntityId, 'programming_basics');
      
      const updatedEducation = world.getComponent(playerEntityId, 'education');
      expect(updatedEducation.activeCourses[0].daysRemaining).toBe(initialDaysRemaining - 1);
    });

    it('должен уменьшать энергию при изучении', () => {
      const initialEnergy = world.getComponent(playerEntityId, 'stats').energy;
      educationSystem.studyCourse(playerEntityId, 'programming_basics');
      
      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.energy).toBeLessThan(initialEnergy);
    });

    it('должен увеличивать стресс при изучении', () => {
      const initialStress = world.getComponent(playerEntityId, 'stats').stress;
      educationSystem.studyCourse(playerEntityId, 'programming_basics');
      
      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.stress).toBeGreaterThan(initialStress);
    });

    it('должен перемещать завершенный курс в completedCourses', () => {
      const education = world.getComponent(playerEntityId, 'education');
      const courseId = education.activeCourses[0].id;
      
      // Прогрессируем курс до завершения
      while (education.activeCourses[0].daysRemaining > 0) {
        educationSystem.studyCourse(playerEntityId, courseId);
      }
      
      const updatedEducation = world.getComponent(playerEntityId, 'education');
      expect(updatedEducation.activeCourses).toHaveLength(0);
      expect(updatedEducation.completedCourses).toHaveLength(1);
      expect(updatedEducation.completedCourses[0].id).toBe(courseId);
    });

    it('должен выдавать награду при завершении курса', () => {
      const education = world.getComponent(playerEntityId, 'education');
      const courseId = education.activeCourses[0].id;
      
      // Добавляем компонент навыков
      world.addComponent(playerEntityId, 'skills', {
        programming: 0
      });
      
      // Прогрессируем курс до завершения
      while (education.activeCourses[0].daysRemaining > 0) {
        educationSystem.studyCourse(playerEntityId, courseId);
      }
      
      const skills = world.getComponent(playerEntityId, 'skills');
      expect(skills.programming).toBe(10);
    });
  });

  describe('getActiveCourses', () => {
    it('должен возвращать список активных курсов', () => {
      const course1 = {
        id: 'programming_basics',
        name: 'Основы программирования',
        durationDays: 7,
        energyCost: 15,
        stressCost: 5,
        reward: { skill: 'programming', value: 10 }
      };
      
      const course2 = {
        id: 'design_basics',
        name: 'Основы дизайна',
        durationDays: 5,
        energyCost: 10,
        stressCost: 3,
        reward: { skill: 'design', value: 8 }
      };
      
      educationSystem.enrollInCourse(playerEntityId, course1);
      educationSystem.enrollInCourse(playerEntityId, course2);
      
      const activeCourses = educationSystem.getActiveCourses(playerEntityId);
      expect(activeCourses).toHaveLength(2);
    });

    it('должен возвращать пустой массив для сущности без курсов', () => {
      const activeCourses = educationSystem.getActiveCourses(playerEntityId);
      expect(activeCourses).toHaveLength(0);
    });
  });

  describe('getCompletedCourses', () => {
    it('должен возвращать список завершенных курсов', () => {
      const course = {
        id: 'programming_basics',
        name: 'Основы программирования',
        durationDays: 7,
        energyCost: 15,
        stressCost: 5,
        reward: { skill: 'programming', value: 10 }
      };
      
      educationSystem.enrollInCourse(playerEntityId, course);
      
      // Завершаем курс
      const education = world.getComponent(playerEntityId, 'education');
      while (education.activeCourses[0].daysRemaining > 0) {
        educationSystem.studyCourse(playerEntityId, course.id);
      }
      
      const completedCourses = educationSystem.getCompletedCourses(playerEntityId);
      expect(completedCourses).toHaveLength(1);
      expect(completedCourses[0].id).toBe('programming_basics');
    });
  });
});
