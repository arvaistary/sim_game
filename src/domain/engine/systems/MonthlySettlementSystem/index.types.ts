export interface SettlementResult {
  success: boolean
  message: string
}

export interface SettlementData {
  month: number
  totalCharged: number
  liquidPaid: number
  reservePaid: number
  shortage: number
  liquidAfter: number
  reserveAfter: number
}
