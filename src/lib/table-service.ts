import { apiClient } from "@/lib/api-client"
export type GetFieldsDto = {
  username: string
  connType: string
  dbType: string
  tableName: string
}

export type TableField = {
  name: string
  type: string
  primary_key: string
  nullable: string
  length: string
  selected?: boolean
}

export type TableDefinition = {
  physicalName: string
  databaseName: string
  selectFields: string
  excludeFields: string
  updateMode: string
  sqlBefore: string
  sqlAfter: string
  conditions: string
  tableDesc: string
  tablePrefix: string
}

export type TransferError = {
  error: string
  timestamp: string
}

export type TransferResponse = {
  message: string
  totalTables: number
  failedTables: number
  successTables: number
  cancelled?: boolean
  errors?: Record<string, TransferError>
}

export async function getFeilds(payload: GetFieldsDto) {
  const url = "/getFields"
  const { data } = await apiClient.post(url, payload)
  return data as TableField[]
}

export async function getRecords(payload: GetFieldsDto) {
  const url = "/getRecords"
  const { data } = await apiClient.post(url, payload)
  return data as Number
}

export async function transferData(username: string, payload: TableDefinition[]): Promise<TransferResponse> {
  const url = `/transfer/${encodeURIComponent(username)}`
  const { data } = await apiClient.post(url, payload)
  return data as TransferResponse
}

export type StopTransferResponse = {
  message: string
  totalTables: number
  failedTables: number
  successTables: number
  cancelled: boolean
  errors?: Record<string, TransferError>
}

export async function stopTransfer(username: string): Promise<StopTransferResponse> {
  const url = `/transfer/${encodeURIComponent(username)}/stop`
  const { data } = await apiClient.post(url)
  return data as StopTransferResponse
}
