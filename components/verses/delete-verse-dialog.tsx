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

interface Verse {
  id: string
  number: number
  text: string
  chapterId: string
  chapterNumber?: number
  bookName?: string
}

interface DeleteVerseDialogProps {
  verse: Verse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteVerseDialog({ verse, open, onOpenChange, onSuccess }: DeleteVerseDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!verse) return

    setIsLoading(true)

    try {
      await apiClient.deleteVerse(verse.id)
      toast({
        title: "Success",
        description: "Verse deleted successfully",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete verse"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const truncateText = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete verse {verse?.number} from {verse?.bookName} Chapter {verse?.chapterNumber}:
            <br />
            <br />
            <em>"{truncateText(verse?.text || "")}"</em>
            <br />
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete Verse"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
