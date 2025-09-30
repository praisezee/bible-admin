"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ChapterForm } from "@/components/chapters/chapter-form"
import { DeleteChapterDialog } from "@/components/chapters/delete-chapter-dialog"
import { ApiErrorAlert } from "@/components/api-error-alert"
import { useChapters } from "@/lib/hooks/use-chapters"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Edit, Trash2, FileText } from "lucide-react"

interface Chapter {
  id: string
  number: number
  bookId: string
  bookName?: string
}

interface Book {
  id: string
  name: string
  testament: string
}

export default function ChaptersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookIdFromUrl = searchParams.get("bookId")
  const bookNameFromUrl = searchParams.get("bookName")

  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [bookFilter, setBookFilter] = useState(bookIdFromUrl || "")
  const [showChapterForm, setShowChapterForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)

  const { toast } = useToast()

  const { data: booksData } = useSWR("/api/book/all", () => apiClient.getBooks(1, 1000), {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
    shouldRetryOnError: false,
  })

  const books = (booksData?.data || []) as Book[]

  useEffect(() => {
    if (!bookFilter && books.length > 0) {
      setBookFilter(books[0].id)
    }
  }, [books, bookFilter])

  const { chapters, totalPages, totalCount, isLoading, error, mutate } = useChapters(
    bookFilter || undefined,
    currentPage,
    100,
  )

  const enrichedChapters = useMemo(() => {
    return chapters
      .map((chapter: any) => {
        const book = books.find((b) => b.id === chapter.bookId)
        return {
          ...chapter,
          bookName: book?.name || "Unknown Book",
          testament: book?.testament,
        }
      })
      .sort((a, b) => a.number - b.number)
  }, [chapters, books])

  const filteredChapters = useMemo(() => {
    if (!searchTerm) return enrichedChapters

    return enrichedChapters.filter(
      (chapter) =>
        chapter.bookName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.number.toString().includes(searchTerm),
    )
  }, [enrichedChapters, searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, bookFilter])

  const handleCreateChapter = () => {
    setSelectedChapter(null)
    setShowChapterForm(true)
  }

  const handleEditChapter = (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedChapter(chapter)
    setShowChapterForm(true)
  }

  const handleDeleteChapter = (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedChapter(chapter)
    setShowDeleteDialog(true)
  }

  const handleChapterClick = (chapter: Chapter) => {
    router.push(
      `/verses?bookId=${chapter.bookId}&bookName=${encodeURIComponent(chapter.bookName || "")}&chapterId=${chapter.id}&chapterNumber=${chapter.number}`,
    )
  }

  const handleFormSuccess = () => {
    mutate()
  }

  const getTestamentLabel = (testament: string) => {
    switch (testament) {
      case "OLD":
        return "Old Covenant"
      case "NEW":
        return "Renewed Covenant"
      case "CUSTOM":
        return "Custom"
      default:
        return testament
    }
  }

  const selectedBook = books.find((b) => b.id === bookFilter)

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Chapters Management</h1>
            <p className="text-sm text-muted-foreground">Manage chapters within Scripture books</p>
          </div>
          <ApiErrorAlert error={error} onRetry={() => mutate()} title="Failed to Load Chapters" />
        </div>
      </DashboardLayout>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {selectedBook ? `${selectedBook.name} - Chapters` : "Chapters Management"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {selectedBook ? `Manage chapters in ${selectedBook.name}` : "Manage chapters within Scripture books"}
          </p>
        </div>
        <Button onClick={handleCreateChapter} size="default" className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Chapter
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Chapters</CardTitle>
          </div>
          <CardDescription>
            A list of all chapters organized by book. Click a chapter to view its verses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chapters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={bookFilter} onValueChange={setBookFilter}>
              <SelectTrigger className="w-full sm:w-[220px] h-10">
                <SelectValue placeholder="Select book" />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredChapters.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">
                {chapters.length === 0
                  ? "No chapters found. Create your first chapter!"
                  : "No chapters match your search criteria."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredChapters.map((chapter: any) => (
                  <Card
                    key={chapter.id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
                    onClick={() => handleChapterClick(chapter)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg">Chapter {chapter.number}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{chapter.bookName}</p>
                          {chapter.testament && (
                            <div className="mt-2">
                              <Badge
                                variant={
                                  chapter.testament === "OLD"
                                    ? "default"
                                    : chapter.testament === "NEW"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {getTestamentLabel(chapter.testament)}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10"
                            onClick={(e) => handleEditChapter(chapter, e)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleDeleteChapter(chapter, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="mt-3 text-xs text-primary font-medium group-hover:underline">View Verses →</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredChapters.length} of {totalCount} chapters
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ChapterForm
        chapter={selectedChapter}
        open={showChapterForm}
        onOpenChange={setShowChapterForm}
        onSuccess={handleFormSuccess}
      />

      <DeleteChapterDialog
        chapter={selectedChapter}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={handleFormSuccess}
      />
    </DashboardLayout>
  )
}
