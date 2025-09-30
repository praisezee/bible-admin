"use client"

import type React from "react"

import { useState, useEffect } from "react"
import useSWR from "swr"
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
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { toast } = useToast()
  const isEditing = !!chapter

  const { data: booksData, isLoading: isLoadingBooks } = useSWR(
    open ? "/api/book/all" : null,
    () => apiClient.getBooks(1, 1000),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    },
  )

  const books = (booksData?.data || []) as Book[]

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEditing ? "Edit Chapter" : "Create New Chapter"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the chapter information below." : "Add a new chapter to a book."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="book" className="text-sm font-medium">
              Book <span className="text-destructive">*</span>
            </Label>
            <Select value={bookId} onValueChange={setBookId} disabled={isLoading || isLoadingBooks} required>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={isLoadingBooks ? "Loading books..." : "Select a book"} />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    <div className="flex items-center gap-2">
                      <span>{book.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {book.testament === "OLD" ? "OT" : book.testament === "NEW" ? "NT" : "Custom"}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select the book this chapter belongs to</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="number" className="text-sm font-medium">
              Chapter Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="number"
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g., 1, 2, 3"
              disabled={isLoading}
              required
              min="1"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">Enter the chapter number (must be positive)</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingBooks}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
