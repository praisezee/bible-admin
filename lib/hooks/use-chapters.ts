import useSWR from "swr"
import { apiClient } from "@/lib/api"

export function useChapters(bookId?: string, page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/api/chapter`, bookId, page, limit],
    () => apiClient.getChapters(bookId, page, limit),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      shouldRetryOnError: false,
      onError: (err) => {
        console.error("[v0] Chapters fetch error:", err)
      },
    },
  )

  return {
    chapters: data?.data || [],
    totalPages: data?.totalPages || 1,
    totalCount: data?.totalCount || 0,
    isLoading,
    isError: error,
    error: error,
    mutate,
  }
}
