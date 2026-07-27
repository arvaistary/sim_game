export interface ExecuteActionCommandResult {
  success: boolean
  message: string
}

export interface JobCatalogEntry {
  name: string
  salaryPerHour: number
  requiredHoursPerWeek: number
}

export interface ProgramCatalogEntry {
  name: string
  duration: number
  cost: number
}
