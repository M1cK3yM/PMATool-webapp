import { apiClient } from "@/lib/api-client"

export type PlanRecord = {
  planId: string
  partCode: string
  warehouse: string
  partDesc1: string
  plannedVolume: number
  addVolume: number
  uom: string
}

function normalizePlanResponse(data: any): PlanRecord[] {
  if (!data) return []
  if (Array.isArray(data)) return data as PlanRecord[]
  return [data as PlanRecord]
}

export async function getPlans(username: string): Promise<PlanRecord[]> {
  const url = "/getPlans"
  const { data } = await apiClient.post(url, { username })
  return normalizePlanResponse(data)
}

export async function getAllPlanIDs(username: string): Promise<string[]> {
  const url = "/mrp/getAllPlanIDs"
  const { data } = await apiClient.post(url, { username })
  if (data && typeof data === 'object' && 'planIds' in data && Array.isArray(data.planIds)) {
    return data.planIds as string[]
  }
  if (Array.isArray(data)) {
    return data as string[]
  }
  return []
}

export async function getPlanById(username: string, planId: string): Promise<PlanRecord[]> {
  const url = `/mrp/getPlan/${encodeURIComponent(planId)}`
  const { data } = await apiClient.post(url, { username })
  return normalizePlanResponse(data)
}

export async function createPlan(payload: PlanRecord[], username: string) {
  const url = `/mrp/${encodeURIComponent(username)}`
  const { data } = await apiClient.post(url, payload)
  return data as { success?: boolean }
}

export interface DeletePlanParams {
  planId: string
  warehouse: string
  partCode: string
  username: string
}

export async function deletePlan(params: DeletePlanParams) {
  const url = "/mrp/deletePlan"
  const { data } = await apiClient.delete(url, { data: params })
  return data as { message?: string; error?: string }
}

