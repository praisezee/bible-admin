"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import { Loader2, Upload } from "lucide-react"

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

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (bookId?: string, chapterId?: string) => void
  books: Book[]
  chapters: Chapter[]
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess, books, chapters }: BulkUploadDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [bookSelection, setBookSelection] = useState<"existing" | "new">("existing")
  const [selectedBookId, setSelectedBookId] = useState("")
  const [newBookName, setNewBookName] = useState("")
  const [testament, setTestament] = useState<"OLD" | "NEW" | "CUSTOM">("CUSTOM")
  const [chapterSelection, setChapterSelection] = useState<"existing" | "new">("existing")
  const [selectedChapterId, setSelectedChapterId] = useState("")
  const [newChapterNumber, setNewChapterNumber] = useState("")
  const [versesText, setVersesText] = useState("")

  const { toast } = useToast()

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setBookSelection("existing")
      setSelectedBookId(books.length > 0 ? books[0].id : "")
      setNewBookName("")
      setTestament("CUSTOM")
      setChapterSelection("existing")
      setSelectedChapterId("")
      setNewChapterNumber("")
      setVersesText("")
    }
  }, [open, books])

  // Update available chapters when book changes
  useEffect(() => {
    if (bookSelection === "existing" && selectedBookId) {
      const bookChapters = chapters.filter((c) => c.bookId === selectedBookId)
      if (bookChapters.length > 0) {
        setSelectedChapterId(bookChapters[0].id)
      } else {
        setSelectedChapterId("")
      }
    }
  }, [selectedBookId, bookSelection, chapters])

  const getAvailableChapters = () => {
    if (bookSelection === "new") return []
    return chapters.filter((c) => c.bookId === selectedBookId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (bookSelection === "existing" && !selectedBookId) {
      toast({
        title: "Validation Error",
        description: "Please select a book",
        variant: "destructive",
      })
      return
    }

    if (bookSelection === "new" && !newBookName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a book name",
        variant: "destructive",
      })
      return
    }

    if (chapterSelection === "existing" && !selectedChapterId) {
      toast({
        title: "Validation Error",
        description: "Please select a chapter",
        variant: "destructive",
      })
      return
    }

    if (chapterSelection === "new" && !newChapterNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a chapter number",
        variant: "destructive",
      })
      return
    }

    if (!versesText.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter verses text",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Determine book name and chapter number
      let bookName: string
      let chapterNumber: number

      if (bookSelection === "existing") {
        const book = books.find((b) => b.id === selectedBookId)
        bookName = book?.name || ""
      } else {
        bookName = newBookName.trim()
      }

      if (chapterSelection === "existing") {
        const chapter = chapters.find((c) => c.id === selectedChapterId)
        chapterNumber = chapter?.number || 1
      } else {
        chapterNumber = Number.parseInt(newChapterNumber, 10)
      }

      const response = await apiClient.bulkUpdateVerses({
        bookName,
        chapterNumber,
        versesText: versesText.trim(),
        testament: bookSelection === "new" ? testament : undefined,
      })

      if (response.success) {
        const verseLines = versesText
          .trim()
          .split("\n")
          .filter((line) => line.trim())
        const verseCount = verseLines.length

        toast({
          title: "Verses Uploaded Successfully",
          description: `${verseCount} verse${verseCount !== 1 ? "s" : ""} uploaded to ${bookName} Chapter ${chapterNumber}`,
        })

        const targetBookId = bookSelection === "existing" ? selectedBookId : undefined
        const targetChapterId = chapterSelection === "existing" ? selectedChapterId : undefined

        onSuccess(targetBookId, targetChapterId)
        onOpenChange(false)
      } else {
        throw new Error(response.message || "Failed to upload verses")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload verses",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Verses</DialogTitle>
          <DialogDescription>
            Upload multiple verses at once. Paste formatted text with verse numbers (e.g., "1 In the beginning..." or
            "i. In the beginning...").
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Book Selection */}
          <div className="space-y-2">
            <Label>Book</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={bookSelection === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setBookSelection("existing")}
                disabled={books.length === 0}
              >
                Existing Book
              </Button>
              <Button
                type="button"
                variant={bookSelection === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setBookSelection("new")}
              >
                New Book
              </Button>
            </div>

            {bookSelection === "existing" ? (
              <Select value={selectedBookId} onValueChange={setSelectedBookId} disabled={books.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Enter book name (e.g., Genesis)"
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                />
                <Select value={testament} onValueChange={(v) => setTestament(v as "OLD" | "NEW" | "CUSTOM")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select testament" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OLD">Old Covenant</SelectItem>
                    <SelectItem value="NEW">Renewed Covenant</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Chapter Selection */}
          <div className="space-y-2">
            <Label>Chapter</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={chapterSelection === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setChapterSelection("existing")}
                disabled={bookSelection === "new" || getAvailableChapters().length === 0}
              >
                Existing Chapter
              </Button>
              <Button
                type="button"
                variant={chapterSelection === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setChapterSelection("new")}
              >
                New Chapter
              </Button>
            </div>

            {chapterSelection === "existing" ? (
              <Select
                value={selectedChapterId}
                onValueChange={setSelectedChapterId}
                disabled={getAvailableChapters().length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a chapter" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableChapters().map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      Chapter {chapter.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="number"
                min="1"
                placeholder="Enter chapter number (e.g., 1)"
                value={newChapterNumber}
                onChange={(e) => setNewChapterNumber(e.target.value)}
              />
            )}
          </div>

          {/* Verses Text */}
          <div className="space-y-2">
            <Label htmlFor="verses-text">Verses Text</Label>
            <Textarea
              id="verses-text"
              placeholder="Paste verses here. Format: '1 In the beginning...' or 'i. In the beginning...'"
              value={versesText}
              onChange={(e) => setVersesText(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: Arabic numerals (1, 2, 3...), Roman numerals (i, ii, iii...), with or without periods.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Verses
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
