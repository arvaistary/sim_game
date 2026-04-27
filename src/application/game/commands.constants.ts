/**
 * Константы для игровых команд
 */

import type { Job, Program } from './commands.constants.types'

export const JOBS: Record<string, Job> = {
  "junior-dev": {
    name: "Junior Developer",
    salaryPerHour: 500,
    requiredHoursPerWeek: 40,
  },
  "mid-dev": {
    name: "Middle Developer",
    salaryPerHour: 1000,
    requiredHoursPerWeek: 40,
  },
  "senior-dev": {
    name: "Senior Developer",
    salaryPerHour: 2000,
    requiredHoursPerWeek: 40,
  },
  "lead-dev": {
    name: "Tech Lead",
    salaryPerHour: 3500,
    requiredHoursPerWeek: 40,
  },
};

export const PROGRAMS: Record<string, Program> = {
  "high-school": { 
    name: "Среднее образование", 
    duration: 1000, 
    cost: 0 
  },
  university: { 
    name: "Университет", 
    duration: 3000, 
    cost: 50000 
  },
  courses: { 
    name: "Курсы", 
    duration: 200, 
    cost: 10000 
  },
};
