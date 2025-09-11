import { create } from "zustand"
import { apiClient } from "./api"

interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: () => {
    // Check if we have a token in memory (this would be lost on refresh)
    // In a real app, you might want to implement a more sophisticated token storage
    set({ isLoading: false })
  },

  login: async (username: string, password: string) => {
    try {
      const response = await apiClient.login(username, password)
      if (response.success && response.data) {
        const { accessToken } = response.data
        apiClient.setAccessToken(accessToken)
        set({
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  },

  logout: () => {
    apiClient.setAccessToken(null)
    set({
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  refreshToken: async () => {
    try {
      const response = await apiClient.refreshToken()
      if (response.success && response.data) {
        const { accessToken } = response.data
        apiClient.setAccessToken(accessToken)
        set({
          accessToken,
          isAuthenticated: true,
        })
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
      // If refresh fails, logout the user
      get().logout()
      throw error
    }
  },
}))
