"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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

interface VerseFormProps {
  verse?: Verse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function VerseForm({ verse, open, onOpenChange, onSuccess }: VerseFormProps) {
  const [number, setNumber] = useState("")
  const [text, setText] = useState("")
  const [selectedBookId, setSelectedBookId] = useState("")
  const [chapterId, setChapterId] = useState("")
  const [books, setBooks] = useState<Book[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingBooks, setIsLoadingBooks] = useState(false)
  const [isLoadingChapters, setIsLoadingChapters] = useState(false)
  const [error, setError] = useState("")

  const { toast } = useToast()
  const isEditing = !!verse

  useEffect(() => {
    if (open) {
      fetchBooks()
    }
  }, [open])

  useEffect(() => {
    if (verse) {
      setNumber(verse.number.toString())
      setText(verse.text)
      setChapterId(verse.chapterId)
      // We'll need to find the book ID from the chapter
      fetchChapterDetails(verse.chapterId)
    } else {
      setNumber("")
      setText("")
      setSelectedBookId("")
      setChapterId("")
      setChapters([])
    }
    setError("")
  }, [verse, open])

  useEffect(() => {
    if (selectedBookId) {
      fetchChapters(selectedBookId)
    } else {
      setChapters([])
      setChapterId("")
    }
  }, [selectedBookId])

  const fetchBooks = async () => {
    try {
      setIsLoadingBooks(true)
      const response = await apiClient.getBooks()
      if (response.success && response.data) {
        setBooks(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch books:", error)
      toast({
        title: "Error",
        description: "Failed to load books",
        variant: "destructive",
      })
    } finally {
      setIsLoadingBooks(false)
    }
  }

  const fetchChapters = async (bookId: string) => {
    try {
      setIsLoadingChapters(true)
      const response = await apiClient.getChapters(bookId)
      if (response.success && response.data) {
        setChapters(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch chapters:", error)
      toast({
        title: "Error",
        description: "Failed to load chapters",
        variant: "destructive",
      })
    } finally {
      setIsLoadingChapters(false)
    }
  }

  const fetchChapterDetails = async (chapterId: string) => {
    try {
      const response = await apiClient.getChapter(chapterId)
      if (response.success && response.data) {
        const chapter = response.data
        setSelectedBookId(chapter.bookId)
      }
    } catch (error) {
      console.error("Failed to fetch chapter details:", error)
    }
  }

  const validateForm = () => {
    if (!number.trim()) {
      setError("Verse number is required")
      return false
    }

    const verseNumber = Number(number)
    if (isNaN(verseNumber) || verseNumber < 1) {
      setError("Verse number must be a positive number")
      return false
    }

    if (!text.trim()) {
      setError("Verse text is required")
      return false
    }

    if (text.trim().length < 3) {
      setError("Verse text must be at least 3 characters long")
      return false
    }

    if (!chapterId) {
      setError("Chapter selection is required")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const verseData = {
        number: Number(number),
        text: text.trim(),
        chapterId,
      }

      if (isEditing && verse) {
        await apiClient.updateVerse(verse.id, verseData)
        toast({
          title: "Success",
          description: "Verse updated successfully",
        })
      } else {
        await apiClient.createVerse(verseData)
        toast({
          title: "Success",
          description: "Verse created successfully",
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Operation failed"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Verse" : "Create New Verse"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the verse information below." : "Add a new verse to a chapter."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="book">Book</Label>
              <Select
                value={selectedBookId}
                onValueChange={setSelectedBookId}
                disabled={isLoading || isLoadingBooks || isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingBooks ? "Loading books..." : "Select a book"} />
                </SelectTrigger>
                <SelectContent>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.name} ({book.testament})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter">Chapter</Label>
              <Select
                value={chapterId}
                onValueChange={setChapterId}
                disabled={isLoading || isLoadingChapters || !selectedBookId || isEditing}
                required
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingChapters
                        ? "Loading chapters..."
                        : !selectedBookId
                          ? "Select a book first"
                          : "Select a chapter"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      Chapter {chapter.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="number">Verse Number</Label>
            <Input
              id="number"
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Enter verse number"
              disabled={isLoading}
              required
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Verse Text</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter verse text (min 3 characters)"
              disabled={isLoading}
              required
              minLength={3}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">{text.length} characters</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingBooks || isLoadingChapters}>
              {isLoading ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Verse" : "Create Verse"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
