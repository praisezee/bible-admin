"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BookForm } from "@/components/books/book-form"
import { DeleteBookDialog } from "@/components/books/delete-book-dialog"
import { ApiErrorAlert } from "@/components/api-error-alert"
import { useBooks } from "@/lib/hooks/use-books"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Edit, Trash2, BookOpen } from "lucide-react"

interface Book {
  id: string
  name: string
  testament: string
  orderIndex: number
}

export default function BooksPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [testamentFilter, setTestamentFilter] = useState("all")
  const [showBookForm, setShowBookForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const { toast } = useToast()

  const { books, totalPages, totalCount, isLoading, error, mutate } = useBooks(currentPage, 100)

  const filteredBooks = useMemo(() => {
    let filtered = books

    if (searchTerm) {
      filtered = filtered.filter((book: Book) => book.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (testamentFilter !== "all") {
      filtered = filtered.filter((book: Book) => book.testament === testamentFilter)
    }

    return filtered.sort((a, b) => a.orderIndex - b.orderIndex)
  }, [books, searchTerm, testamentFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, testamentFilter])

  const handleCreateBook = () => {
    setSelectedBook(null)
    setShowBookForm(true)
  }

  const handleEditBook = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedBook(book)
    setShowBookForm(true)
  }

  const handleDeleteBook = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedBook(book)
    setShowDeleteDialog(true)
  }

  const handleBookClick = (book: Book) => {
    router.push(`/chapters?bookId=${book.id}&bookName=${encodeURIComponent(book.name)}`)
  }

  const handleFormSuccess = () => {
    mutate()
  }

  const getTestamentBadgeVariant = (testament: string) => {
    switch (testament) {
      case "OLD":
        return "default"
      case "NEW":
        return "secondary"
      case "CUSTOM":
        return "outline"
      default:
        return "default"
    }
  }

  const getTestamentLabel = (testament: string) => {
    switch (testament) {
      case "OLD":
        return "Old Covenant"
      case "NEW":
        return "Renewed Covenant"
      case "CUSTOM":
        return "Custom"
      default:
        return testament
    }
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Books Management</h1>
            <p className="text-sm text-muted-foreground">Manage Scripture books and covenants</p>
          </div>
          <ApiErrorAlert error={error} onRetry={() => mutate()} title="Failed to Load Books" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Books Management</h1>
          <p className="text-sm text-muted-foreground">Manage Scripture books and covenants</p>
        </div>
        <Button onClick={handleCreateBook} size="default" className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle>Books</CardTitle>
          </div>
          <CardDescription>
            A list of all books in the Scripture database. Click a book to view its chapters, or use the icons to edit
            or delete.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={testamentFilter} onValueChange={setTestamentFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-10">
                <SelectValue placeholder="Filter by covenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Covenants</SelectItem>
                <SelectItem value="OLD">Old Covenant</SelectItem>
                <SelectItem value="NEW">Renewed Covenant</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-5 w-1/2" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">
                {books.length === 0
                  ? "No books found. Create your first book!"
                  : "No books match your search criteria."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredBooks.map((book: Book) => (
                  <Card
                    key={book.id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 relative"
                    onClick={() => handleBookClick(book)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2">{book.name}</CardTitle>
                          <div className="mt-2">
                            <Badge variant={getTestamentBadgeVariant(book.testament)} className="text-xs">
                              {getTestamentLabel(book.testament)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10"
                            onClick={(e) => handleEditBook(book, e)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleDeleteBook(book, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm text-muted-foreground">
                        Order: <span className="font-medium">{book.orderIndex}</span>
                      </div>
                      <div className="mt-3 text-xs text-primary font-medium group-hover:underline">View Chapters →</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredBooks.length} of {totalCount} books
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <BookForm book={selectedBook} open={showBookForm} onOpenChange={setShowBookForm} onSuccess={handleFormSuccess} />

      <DeleteBookDialog
        book={selectedBook}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={handleFormSuccess}
      />
    </DashboardLayout>
  )
}
