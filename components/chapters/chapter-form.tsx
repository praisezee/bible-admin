"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface ChapterFormProps {
  chapter?: Chapter | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ChapterForm({ chapter, open, onOpenChange, onSuccess }: ChapterFormProps) {
  const [number, setNumber] = useState("")
  const [bookId, setBookId] = useState("")
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingBooks, setIsLoadingBooks] = useState(false)
  const [error, setError] = useState("")

  const { toast } = useToast()
  const isEditing = !!chapter

  useEffect(() => {
    if (open) {
      fetchBooks()
    }
  }, [open])

  useEffect(() => {
    if (chapter) {
      setNumber(chapter.number.toString())
      setBookId(chapter.bookId)
    } else {
      setNumber("")
      setBookId("")
    }
    setError("")
  }, [chapter, open])

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

  const validateForm = () => {
    if (!number.trim()) {
      setError("Chapter number is required")
      return false
    }

    const chapterNumber = Number(number)
    if (isNaN(chapterNumber) || chapterNumber < 1) {
      setError("Chapter number must be a positive number")
      return false
    }

    if (!bookId) {
      setError("Book selection is required")
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
      const chapterData = {
        number: Number(number),
        bookId,
      }

      if (isEditing && chapter) {
        await apiClient.updateChapter(chapter.id, chapterData)
        toast({
          title: "Success",
          description: "Chapter updated successfully",
        })
      } else {
        await apiClient.createChapter(chapterData)
        toast({
          title: "Success",
          description: "Chapter created successfully",
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Chapter" : "Create New Chapter"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the chapter information below." : "Add a new chapter to a book."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="book">Book</Label>
            <Select value={bookId} onValueChange={setBookId} disabled={isLoading || isLoadingBooks} required>
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
            <Label htmlFor="number">Chapter Number</Label>
            <Input
              id="number"
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Enter chapter number"
              disabled={isLoading}
              required
              min="1"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingBooks}>
              {isLoading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Chapter"
                  : "Create Chapter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
