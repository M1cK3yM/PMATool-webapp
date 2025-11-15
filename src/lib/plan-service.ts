import { apiClient } from "@/lib/api-client"

export type PlanRecord = {
  planId: string
  partCode: string
  warehouse: string
  partDesc1: string
  plannedVolume: string
  addVolume: string
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

