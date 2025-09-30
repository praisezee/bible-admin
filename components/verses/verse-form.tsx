"use client"

import type React from "react"

import { useState, useEffect } from "react"
import useSWR from "swr"
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
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { toast } = useToast()
  const isEditing = !!verse

  const { data: booksData, isLoading: isLoadingBooks } = useSWR(
    open ? "/api/book/all" : null,
    () => apiClient.getBooks(1, 1000),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    },
  )

  const { data: chaptersData, isLoading: isLoadingChapters } = useSWR(
    open && selectedBookId ? ["/api/chapter/by-book", selectedBookId] : null,
    () => apiClient.getChapters(selectedBookId, 1, 1000),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    },
  )

  const books = (booksData?.data || []) as Book[]
  const chapters = (chaptersData?.data || []) as Chapter[]

  useEffect(() => {
    if (verse) {
      setNumber(verse.number.toString())
      setText(verse.text)
      setChapterId(verse.chapterId)
    } else {
      setNumber("")
      setText("")
      setSelectedBookId("")
      setChapterId("")
    }
    setError("")
  }, [verse, open])

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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEditing ? "Edit Verse" : "Create New Verse"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the verse information below." : "Add a new verse to a chapter."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="book" className="text-sm font-medium">
                Book <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedBookId}
                onValueChange={setSelectedBookId}
                disabled={isLoading || isLoadingBooks || isEditing}
              >
                <SelectTrigger className="h-10">
                  <SelectValue
                    placeholder={
                      isLoadingBooks ? "Loading books..." : isEditing ? verse?.bookName || "Book" : "Select a book"
                    }
                  />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter" className="text-sm font-medium">
                Chapter <span className="text-destructive">*</span>
              </Label>
              <Select
                value={chapterId}
                onValueChange={setChapterId}
                disabled={isLoading || isLoadingChapters || !selectedBookId || isEditing}
                required
              >
                <SelectTrigger className="h-10">
                  <SelectValue
                    placeholder={
                      isLoadingChapters
                        ? "Loading chapters..."
                        : !selectedBookId
                          ? "Select a book first"
                          : isEditing
                            ? `Chapter ${verse?.chapterNumber || ""}`
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
            <Label htmlFor="number" className="text-sm font-medium">
              Verse Number <span className="text-destructive">*</span>
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
            <p className="text-xs text-muted-foreground">Enter the verse number (must be positive)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text" className="text-sm font-medium">
              Verse Text <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the complete verse text..."
              disabled={isLoading}
              required
              minLength={3}
              rows={6}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Minimum 3 characters required</span>
              <span className={text.length < 3 ? "text-destructive" : ""}>{text.length} characters</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingBooks || isLoadingChapters}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Verse" : "Create Verse"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
