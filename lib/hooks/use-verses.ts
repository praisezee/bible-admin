import useSWR from "swr"
import { apiClient } from "@/lib/api"

export function useVerses(chapterId?: string, page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR(
    [`/api/verse`, chapterId, page, limit],
    () => apiClient.getVerses(chapterId, page, limit),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      shouldRetryOnError: false,
      onError: (err) => {
        console.error("[v0] Verses fetch error:", err)
      },
    },
  )

  return {
    verses: data?.data || [],
    totalPages: data?.totalPages || 1,
    totalCount: data?.totalCount || 0,
    isLoading,
    isError: error,
    error: error,
    mutate,
  }
}
