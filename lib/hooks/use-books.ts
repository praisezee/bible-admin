import useSWR from "swr"
import { apiClient } from "@/lib/api"

export function useBooks(page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR([`/api/book`, page, limit], () => apiClient.getBooks(page, limit), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    shouldRetryOnError: false, // Don't retry on error to avoid spam
    onError: (err) => {
      console.error("[v0] Books fetch error:", err)
    },
  })

  return {
    books: data?.data || [],
    totalPages: data?.totalPages || 1,
    totalCount: data?.totalCount || 0,
    isLoading,
    isError: error,
    error: error,
    mutate,
  }
}
