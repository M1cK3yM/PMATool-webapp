import axios from "axios"

const baseURL = process.env.NEXT_PUBLIC_API_DOMAIN || "http://localhost:8081"

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
})

export function setAuthToken(token?: string) {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common["Authorization"]
  }
}


