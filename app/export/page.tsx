"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/dashboard-layout"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { BibleData, BookData, ChapterData, VerseData } from "@/lib/types"
import { Download, FileText, CheckCircle, AlertCircle } from "lucide-react"

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

  const fetchAllData = async () => {
    setExportProgress(10)

    // Fetch all books
    const booksResponse = await apiClient.getBooks()
    if (!booksResponse.success || !booksResponse.data) {
      throw new Error("Failed to fetch books")
    }
    const books = booksResponse.data
    setExportProgress(30)

    // Fetch all chapters
    const chaptersResponse = await apiClient.getChapters()
    if (!chaptersResponse.success || !chaptersResponse.data) {
      throw new Error("Failed to fetch chapters")
    }
    const chapters = chaptersResponse.data
    setExportProgress(50)

    // Fetch all verses
    const versesResponse = await apiClient.getVerses()
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
        // Sort by testament first (OLD, NEW, CUSTOM), then by name
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
    link.download = `bible-export-${new Date().toISOString().split("T")[0]}.json`
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
        description: "Bible data has been exported successfully",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Export Bible Data</h1>
          <p className="text-muted-foreground">Download complete Bible database as JSON</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Export Options
            </CardTitle>
            <CardDescription>
              Export the complete Bible database including all books, chapters, and verses in JSON format.
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Export Progress</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  {exportProgress < 30 && "Fetching books..."}
                  {exportProgress >= 30 && exportProgress < 50 && "Fetching chapters..."}
                  {exportProgress >= 50 && exportProgress < 70 && "Fetching verses..."}
                  {exportProgress >= 70 && exportProgress < 90 && "Structuring data..."}
                  {exportProgress >= 90 && exportProgress < 100 && "Preparing download..."}
                  {exportProgress === 100 && "Export complete!"}
                </p>
              </div>
            )}

            <Button onClick={handleExport} disabled={isExporting} className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Bible Data"}
            </Button>

            {lastExportTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Last exported: {formatDateTime(lastExportTime)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Information</CardTitle>
            <CardDescription>Details about the exported data format and structure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exportStats && (
              <div className="space-y-3">
                <h4 className="font-medium">Export Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{exportStats.books}</div>
                    <div className="text-xs text-muted-foreground">Books</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{exportStats.chapters}</div>
                    <div className="text-xs text-muted-foreground">Chapters</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{exportStats.verses}</div>
                    <div className="text-xs text-muted-foreground">Verses</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-medium">Data Structure</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">JSON</Badge>
                  <span className="text-sm">Structured JSON format</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Hierarchical</Badge>
                  <span className="text-sm">Books → Chapters → Verses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Sorted</Badge>
                  <span className="text-sm">Ordered by testament and number</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">File Format</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• File name: bible-export-YYYY-MM-DD.json</p>
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
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
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
