import type { ApiResponse } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"

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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("API request failed:", error)
      throw error
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
  async getBooks() {
    return this.request("/api/book")
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
  async getChapters(bookId?: string) {
    const query = bookId ? `?bookId=${bookId}` : ""
    return this.request(`/api/chapter${query}`)
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
  async getVerses(chapterId?: string) {
    const query = chapterId ? `?chapterId=${chapterId}` : ""
    return this.request(`/api/verse${query}`)
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
