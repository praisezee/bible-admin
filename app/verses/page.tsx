"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VerseForm } from "@/components/verses/verse-form"
import { DeleteVerseDialog } from "@/components/verses/delete-verse-dialog"
import { BulkUploadDialog } from "@/components/verses/bulk-upload-dialog"
import { ApiErrorAlert } from "@/components/api-error-alert"
import { useVerses } from "@/lib/hooks/use-verses"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Edit, Trash2, ScrollText, Upload } from "lucide-react"

interface Verse {
  id: string
  number: number
  text: string
  chapterId: string
  chapterNumber?: number
  bookName?: string
}

interface Book {
  id: string
  name: string
  testament: string
}

interface Chapter {
  id: string
  number: number
  bookId: string
}

export default function VersesPage() {
  const searchParams = useSearchParams()
  const chapterIdFromUrl = searchParams.get("chapterId")
  const bookIdFromUrl = searchParams.get("bookId")

  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [bookFilter, setBookFilter] = useState(bookIdFromUrl || "")
  const [chapterFilter, setChapterFilter] = useState(chapterIdFromUrl || "")
  const [showVerseForm, setShowVerseForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null)

  const { toast } = useToast()

  const { data: booksData } = useSWR("/api/book/all", () => apiClient.getBooks(1, 1000), {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
    shouldRetryOnError: false,
  })

  const { data: chaptersData } = useSWR("/api/chapter/all", () => apiClient.getChapters(undefined, 1, 1000), {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
    shouldRetryOnError: false,
  })

  const books = (booksData?.data || []) as Book[]
  const chapters = (chaptersData?.data || []) as Chapter[]

  useEffect(() => {
    if (!bookFilter && books.length > 0) {
      setBookFilter(books[0].id)
    }
  }, [books, bookFilter])

  useEffect(() => {
    if (!chapterFilter && chapters.length > 0 && bookFilter) {
      const firstChapterOfBook = chapters.find((c) => c.bookId === bookFilter)
      if (firstChapterOfBook) {
        setChapterFilter(firstChapterOfBook.id)
      }
    }
  }, [chapters, bookFilter, chapterFilter])

  const { verses, totalPages, totalCount, isLoading, error, mutate } = useVerses(
    chapterFilter || undefined,
    currentPage,
    100,
  )

  const enrichedVerses = useMemo(() => {
    return verses
      .map((verse: any) => {
        const chapter = chapters.find((c) => c.id === verse.chapterId)
        const book = books.find((b) => b.id === chapter?.bookId)
        return {
          ...verse,
          chapterNumber: chapter?.number || 0,
          bookName: book?.name || "Unknown Book",
          testament: book?.testament,
        }
      })
      .sort((a, b) => a.number - b.number)
  }, [verses, chapters, books])

  const filteredVerses = useMemo(() => {
    let filtered = enrichedVerses

    if (searchTerm) {
      filtered = filtered.filter(
        (verse) =>
          verse.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          verse.bookName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          verse.number.toString().includes(searchTerm),
      )
    }

    if (bookFilter) {
      const selectedBookChapters = chapters.filter((c) => c.bookId === bookFilter)
      filtered = filtered.filter((verse) => selectedBookChapters.some((chapter) => chapter.id === verse.chapterId))
    }

    return filtered
  }, [enrichedVerses, searchTerm, bookFilter, chapters])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, bookFilter, chapterFilter])

  const handleCreateVerse = () => {
    setSelectedVerse(null)
    setShowVerseForm(true)
  }

  const handleEditVerse = (verse: Verse, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedVerse(verse)
    setShowVerseForm(true)
  }

  const handleDeleteVerse = (verse: Verse, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedVerse(verse)
    setShowDeleteDialog(true)
  }

  const handleBulkUploadSuccess = async (bookId?: string, chapterId?: string) => {
    // Refresh all data
    await mutate()

    if (bookId) {
      setBookFilter(bookId)

      // Wait a moment for the data to refresh, then set chapter filter
      setTimeout(async () => {
        if (chapterId) {
          setChapterFilter(chapterId)
        } else if (bookId) {
          // If no chapter ID provided (new chapter), find the latest chapter for this book
          const updatedChapters = await apiClient.getChapters(undefined, 1, 1000)
          const bookChapters = (updatedChapters.data || []).filter((c: Chapter) => c.bookId === bookId)
          if (bookChapters.length > 0) {
            // Sort by chapter number and get the last one
            const latestChapter = bookChapters.sort((a: Chapter, b: Chapter) => b.number - a.number)[0]
            setChapterFilter(latestChapter.id)
          }
        }
      }, 500)
    }
  }

  const handleFormSuccess = () => {
    mutate()
  }

  const truncateText = (text: string, maxLength = 120) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const getAvailableChapters = () => {
    if (!bookFilter) return chapters
    return chapters.filter((chapter) => chapter.bookId === bookFilter)
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
  const selectedChapter = chapters.find((c) => c.id === chapterFilter)

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Verses Management</h1>
            <p className="text-sm text-muted-foreground">Manage individual verses within chapters</p>
          </div>
          <ApiErrorAlert error={error} onRetry={() => mutate()} title="Failed to Load Verses" />
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
            {selectedBook && selectedChapter
              ? `${selectedBook.name} ${selectedChapter.number} - Verses`
              : "Verses Management"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {selectedBook && selectedChapter
              ? `Manage verses in ${selectedBook.name} chapter ${selectedChapter.number}`
              : "Manage individual verses within chapters"}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={() => setShowBulkUpload(true)}
            variant="outline"
            size="default"
            className="flex-1 md:flex-initial"
          >
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={handleCreateVerse} size="default" className="flex-1 md:flex-initial">
            <Plus className="mr-2 h-4 w-4" />
            Add Verse
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            <CardTitle>Verses</CardTitle>
          </div>
          <CardDescription>
            A list of all verses organized by book and chapter. You can create, edit, and delete verses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search verses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={bookFilter} onValueChange={setBookFilter}>
                <SelectTrigger className="w-full sm:flex-1 h-10">
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
              <Select value={chapterFilter} onValueChange={setChapterFilter}>
                <SelectTrigger className="w-full sm:flex-1 h-10">
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableChapters().map((chapter) => {
                    const book = books.find((b) => b.id === chapter.bookId)
                    return (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        {book?.name} Ch. {chapter.number}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredVerses.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">
                {verses.length === 0
                  ? "No verses found. Create your first verse!"
                  : "No verses match your search criteria."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {filteredVerses.map((verse: any) => (
                  <Card key={verse.id} className="group hover:shadow-md transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-semibold">
                              {verse.bookName} {verse.chapterNumber}:{verse.number}
                            </Badge>
                            {verse.testament && (
                              <Badge
                                variant={
                                  verse.testament === "OLD"
                                    ? "default"
                                    : verse.testament === "NEW"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {getTestamentLabel(verse.testament)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10"
                            onClick={(e) => handleEditVerse(verse, e)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleDeleteVerse(verse, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm leading-relaxed">{verse.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredVerses.length} of {totalCount} verses
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

      <VerseForm
        verse={selectedVerse}
        open={showVerseForm}
        onOpenChange={setShowVerseForm}
        onSuccess={handleFormSuccess}
      />

      <DeleteVerseDialog
        verse={selectedVerse}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={handleFormSuccess}
      />

      <BulkUploadDialog
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onSuccess={handleBulkUploadSuccess}
        books={books}
        chapters={chapters}
      />
    </DashboardLayout>
  )
}
