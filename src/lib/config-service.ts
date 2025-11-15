import { apiClient } from "@/lib/api-client"

export type CreateConfigDto = {
  username: string
  src_fin_con_str?: string
  src_man_con_str?: string
  des_fin_con_str?: string
  des_man_con_str?: string
  plan_dsn?: string
}

export async function createConfig(payload: CreateConfigDto) {
  const url = "/config"
  const { data } = await apiClient.post(url, payload)
  return data as { success?: boolean }
}

export type ConfigResponse = {
  username: string
  src_fin_con_str: string
  src_man_con_str: string
  des_fin_con_str: string
  des_man_con_str: string
  plan_dsn: string
}

export async function getConfig(username: string) {
  const url = `/config/${encodeURIComponent(username)}`
  const { data } = await apiClient.get(url)
  return data as ConfigResponse
}

export type TestConnectionRequest = {
  dsn: string
}

export type TestConnectionResponse = {
  success: boolean
  message?: string
  error?: string
}

export async function testConnection(dsn: string): Promise<TestConnectionResponse> {
  const url = "/testConnection"
  const { data } = await apiClient.post(url, { dsn } as TestConnectionRequest)
  return data as TestConnectionResponse
}

