"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/dashboard-layout"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { BibleData, BookData, ChapterData, VerseData } from "@/lib/types"
import { Download, FileText, CheckCircle, AlertCircle, Database, BookOpen } from "lucide-react"

interface ExportStats {
  books: number
  chapters: number
  verses: number
}

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStats, setExportStats] = useState<ExportStats | null>(null)
  const [error, setError] = useState("")
  const [lastExportTime, setLastExportTime] = useState<string | null>(null)

  const { toast } = useToast()

  const { data: booksData } = useSWR("/api/book/stats", () => apiClient.getBooks(1, 1000), {
    revalidateOnFocus: false,
  })

  const { data: chaptersData } = useSWR("/api/chapter/stats", () => apiClient.getChapters(undefined, 1, 1000), {
    revalidateOnFocus: false,
  })

  const { data: versesData } = useSWR("/api/verse/stats", () => apiClient.getVerses(undefined, 1, 1000), {
    revalidateOnFocus: false,
  })

  const currentStats = {
    books: booksData?.totalCount || booksData?.data?.length || 0,
    chapters: chaptersData?.totalCount || chaptersData?.data?.length || 0,
    verses: versesData?.totalCount || versesData?.data?.length || 0,
  }

  const fetchAllData = async () => {
    setExportProgress(10)

    const booksResponse = await apiClient.getBooks(1, 10000)
    if (!booksResponse.success || !booksResponse.data) {
      throw new Error("Failed to fetch books")
    }
    const books = booksResponse.data
    setExportProgress(30)

    const chaptersResponse = await apiClient.getChapters(undefined, 1, 10000)
    if (!chaptersResponse.success || !chaptersResponse.data) {
      throw new Error("Failed to fetch chapters")
    }
    const chapters = chaptersResponse.data
    setExportProgress(50)

    const versesResponse = await apiClient.getVerses(undefined, 1, 10000)
    if (!versesResponse.success || !versesResponse.data) {
      throw new Error("Failed to fetch verses")
    }
    const verses = versesResponse.data
    setExportProgress(70)

    return { books, chapters, verses }
  }

  const structureData = (books: any[], chapters: any[], verses: any[]): BibleData => {
    setExportProgress(80)

    const structuredBooks: BookData[] = books.map((book) => {
      const bookChapters = chapters.filter((chapter) => chapter.bookId === book.id)

      const structuredChapters: ChapterData[] = bookChapters.map((chapter) => {
        const chapterVerses = verses.filter((verse) => verse.chapterId === chapter.id)

        const structuredVerses: VerseData[] = chapterVerses
          .sort((a, b) => a.number - b.number)
          .map((verse) => ({
            number: verse.number,
            text: verse.text,
          }))

        return {
          number: chapter.number,
          verses: structuredVerses,
        }
      })

      return {
        name: book.name,
        testament: book.testament,
        chapters: structuredChapters.sort((a, b) => a.number - b.number),
      }
    })

    setExportProgress(90)

    return {
      version: "1.0",
      books: structuredBooks.sort((a, b) => {
        if (a.testament !== b.testament) {
          const testamentOrder = { OLD: 1, NEW: 2, CUSTOM: 3 }
          return (
            (testamentOrder[a.testament as keyof typeof testamentOrder] || 4) -
            (testamentOrder[b.testament as keyof typeof testamentOrder] || 4)
          )
        }
        return a.name.localeCompare(b.name)
      }),
    }
  }

  const downloadJSON = (data: BibleData) => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `scripture-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)
    setError("")

    try {
      const { books, chapters, verses } = await fetchAllData()

      setExportStats({
        books: books.length,
        chapters: chapters.length,
        verses: verses.length,
      })

      const structuredData = structureData(books, chapters, verses)
      setExportProgress(95)

      downloadJSON(structuredData)
      setExportProgress(100)

      setLastExportTime(new Date().toISOString())

      toast({
        title: "Export Successful",
        description: "Scripture data has been exported successfully",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Export failed"
      setError(errorMessage)
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setTimeout(() => setExportProgress(0), 2000)
    }
  }

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Export Scripture Data</h1>
        <p className="text-muted-foreground">Download complete Scripture database as structured JSON</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Books</p>
                <p className="text-3xl font-bold">{currentStats.books}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chapters</p>
                <p className="text-3xl font-bold">{currentStats.chapters}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verses</p>
                <p className="text-3xl font-bold">{currentStats.verses}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                <Database className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle>Export Options</CardTitle>
            </div>
            <CardDescription>
              Export the complete Scripture database including all books, chapters, and verses in JSON format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isExporting && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Export Progress</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="w-full h-2" />
                <p className="text-sm text-muted-foreground">
                  {exportProgress < 30 && "Fetching books..."}
                  {exportProgress >= 30 && exportProgress < 50 && "Fetching chapters..."}
                  {exportProgress >= 50 && exportProgress < 70 && "Fetching verses..."}
                  {exportProgress >= 70 && exportProgress < 90 && "Structuring data..."}
                  {exportProgress >= 90 && exportProgress < 100 && "Preparing download..."}
                  {exportProgress === 100 && "Export complete!"}
                </p>
              </div>
            )}

            <Button onClick={handleExport} disabled={isExporting} className="w-full h-12" size="lg">
              {isExporting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" />
                  Export Scripture Data
                </>
              )}
            </Button>

            {lastExportTime && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-900 dark:text-green-100">Last exported successfully</p>
                  <p className="text-green-700 dark:text-green-300">{formatDateTime(lastExportTime)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Information</CardTitle>
            <CardDescription>Details about the exported data format and structure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {exportStats && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Last Export Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-primary">{exportStats.books}</div>
                    <div className="text-xs text-muted-foreground mt-1">Books</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-primary">{exportStats.chapters}</div>
                    <div className="text-xs text-muted-foreground mt-1">Chapters</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold text-primary">{exportStats.verses}</div>
                    <div className="text-xs text-muted-foreground mt-1">Verses</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Data Structure</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">JSON</Badge>
                  <span className="text-sm text-muted-foreground">Structured JSON format</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Hierarchical</Badge>
                  <span className="text-sm text-muted-foreground">Books → Chapters → Verses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Sorted</Badge>
                  <span className="text-sm text-muted-foreground">Ordered by covenant and number</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">File Format</h4>
              <div className="text-sm text-muted-foreground space-y-1.5 leading-relaxed">
                <p>• File name: scripture-export-YYYY-MM-DD.json</p>
                <p>• Format: UTF-8 encoded JSON</p>
                <p>• Structure: Compatible with BibleData interface</p>
                <p>• Size: Varies based on content</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sample Export Structure</CardTitle>
          <CardDescription>Preview of the JSON structure that will be exported.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border">
            {`{
  "version": "1.0",
  "books": [
    {
      "name": "Genesis",
      "testament": "OLD",
      "chapters": [
        {
          "number": 1,
          "verses": [
            {
              "number": 1,
              "text": "In the beginning God created..."
            },
            {
              "number": 2,
              "text": "And the earth was without form..."
            }
          ]
        }
      ]
    }
  ]
}`}
          </pre>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
