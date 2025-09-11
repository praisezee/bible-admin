"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Chapter {
  id: string
  number: number
  bookId: string
  bookName?: string
}

interface DeleteChapterDialogProps {
  chapter: Chapter | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteChapterDialog({ chapter, open, onOpenChange, onSuccess }: DeleteChapterDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!chapter) return

    setIsLoading(true)

    try {
      await apiClient.deleteChapter(chapter.id)
      toast({
        title: "Success",
        description: "Chapter deleted successfully",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete chapter"
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete Chapter {chapter?.number} from "{chapter?.bookName}" and all its verses. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete Chapter"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
