export type ValidateActionCatalogReturn = {
  valid: boolean
  schemaErrors: Array<SchemaErrorItem>
  duplicateIds: string[]
  missingFields: Array<MissingFieldItem>
};

export type ValidateRequiredFieldsReturn = {
  valid: boolean
  missing: Array<MissingItem>
};

export type ValidateUniqueIdsReturn = {
  valid: boolean
  duplicates: string[]
};

export type ValidateActionArrayReturn = {
  valid: boolean
  errors: Array<ErrorItem>
};

export type ValidateActionWithErrorsReturn = {
  valid: boolean
  errors: string[]
};

export interface MissingFieldItem {
  id: string; 
  missingFields: string[]
}

export interface SchemaErrorItem {
  index: number; 
  errors: string[]
}

export interface MissingItem {
  id: string; 
  missingFields: string[]
}

export interface ErrorItem {
  index: number; 
  errors: string[]
}
