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
import { Loader2 } from "lucide-react"

interface Book {
  id: string
  name: string
  testament: string
  orderIndex: number
}

interface BookFormProps {
  book?: Book | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BookForm({ book, open, onOpenChange, onSuccess }: BookFormProps) {
  const [name, setName] = useState("")
  const [testament, setTestament] = useState("")
  const [orderIndex, setOrderIndex] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { toast } = useToast()
  const isEditing = !!book

  useEffect(() => {
    if (book) {
      setName(book.name)
      setTestament(book.testament)
      setOrderIndex(book.orderIndex.toString())
    } else {
      setName("")
      setTestament("")
      setOrderIndex("")
    }
    setError("")
  }, [book, open])

  const validateForm = () => {
    if (!name.trim()) {
      setError("Book name is required")
      return false
    }

    if (name.trim().length < 3) {
      setError("Book name must be at least 3 characters long")
      return false
    }

    if (!testament) {
      setError("Covenant is required")
      return false
    }

    if (!["OLD", "NEW", "CUSTOM"].includes(testament)) {
      setError("Covenant must be OLD, NEW, or CUSTOM")
      return false
    }

    if (orderIndex && isNaN(Number(orderIndex))) {
      setError("Order index must be a number")
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
      const bookData = {
        name: name.trim(),
        testament,
        ...(orderIndex && { orderIndex: Number(orderIndex) }),
      }

      if (isEditing && book) {
        await apiClient.updateBook(book.id, bookData)
        toast({
          title: "Success",
          description: "Book updated successfully",
        })
      } else {
        await apiClient.createBook(bookData)
        toast({
          title: "Success",
          description: "Book created successfully",
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
          <DialogTitle className="text-xl">{isEditing ? "Edit Book" : "Create New Book"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the book information below." : "Add a new book to the Scripture database."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Book Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Genesis, Exodus, Matthew"
              disabled={isLoading}
              required
              minLength={3}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">Minimum 3 characters required</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testament" className="text-sm font-medium">
              Covenant <span className="text-destructive">*</span>
            </Label>
            <Select value={testament} onValueChange={setTestament} disabled={isLoading} required>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select covenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OLD">Old Covenant</SelectItem>
                <SelectItem value="NEW">Renewed Covenant</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderIndex" className="text-sm font-medium">
              Order Index <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Input
              id="orderIndex"
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              placeholder="e.g., 1, 2, 3"
              disabled={isLoading}
              min="1"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">Used for sorting books in order</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Book" : "Create Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
