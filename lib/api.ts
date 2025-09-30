import type { ApiResponse } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

class ApiClient {
  private accessToken: string | null = null

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  getAccessToken() {
    return this.accessToken
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.accessToken && !endpoint.includes("/auth/")) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`

        try {
          const data = await response.json()
          errorMessage = data.message || errorMessage
        } catch {
          // Response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }

        throw new ApiError(errorMessage, response.status, endpoint)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // Network error or fetch failed
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ApiError(
          `Cannot connect to API at ${API_BASE_URL}. Please check if the API server is running and NEXT_PUBLIC_API_BASE_URL is configured correctly.`,
          0,
          endpoint,
        )
      }

      throw new ApiError(error instanceof Error ? error.message : "Unknown error occurred", undefined, endpoint)
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    return this.request<{ accessToken: string; refreshToken: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  }

  async signup(username: string, password: string) {
    return this.request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  }

  async refreshToken() {
    return this.request<{ accessToken: string }>("/api/auth/refresh", {
      method: "POST",
    })
  }

  // Books endpoints
  async getBooks(page = 1, limit = 20) {
    return this.request(`/api/book?page=${page}&limit=${limit}`)
  }

  async getBook(id: string) {
    return this.request(`/api/book/${id}`)
  }

  async createBook(data: { name: string; testament: string; orderIndex?: number }) {
    return this.request("/api/book", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateBook(id: string, data: { name: string; testament: string; orderIndex?: number }) {
    return this.request(`/api/book/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteBook(id: string) {
    return this.request(`/api/book/${id}`, {
      method: "DELETE",
    })
  }

  async getLastUpdated() {
    return this.request("/api/book/last-updated")
  }

  // Chapters endpoints
  async getChapters(bookId?: string, page = 1, limit = 20) {
    const params = new URLSearchParams()
    if (bookId) params.append("bookId", bookId)
    params.append("page", page.toString())
    params.append("limit", limit.toString())
    return this.request(`/api/chapter?${params.toString()}`)
  }

  async getChapter(id: string) {
    return this.request(`/api/chapter/${id}`)
  }

  async createChapter(data: { number: number; bookId: string }) {
    return this.request("/api/chapter", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateChapter(id: string, data: { number: number; bookId: string }) {
    return this.request(`/api/chapter/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteChapter(id: string) {
    return this.request(`/api/chapter/${id}`, {
      method: "DELETE",
    })
  }

  // Verses endpoints
  async getVerses(chapterId?: string, page = 1, limit = 20) {
    const params = new URLSearchParams()
    if (chapterId) params.append("chapterId", chapterId)
    params.append("page", page.toString())
    params.append("limit", limit.toString())
    return this.request(`/api/verse?${params.toString()}`)
  }

  async getVerse(id: string) {
    return this.request(`/api/verse/${id}`)
  }

  async createVerse(data: { number: number; text: string; chapterId: string }) {
    return this.request("/api/verse", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateVerse(id: string, data: { number: number; text: string; chapterId: string }) {
    return this.request(`/api/verse/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteVerse(id: string) {
    return this.request(`/api/verse/${id}`, {
      method: "DELETE",
    })
  }
}

export const apiClient = new ApiClient()
