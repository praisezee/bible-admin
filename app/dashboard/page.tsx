"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, FileText, Quote, Clock, ArrowRight } from "lucide-react"
import { apiClient } from "@/lib/api"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ApiErrorAlert } from "@/components/api-error-alert"
import Link from "next/link"

export default function DashboardPage() {
  const {
    data: booksData,
    isLoading: booksLoading,
    error: booksError,
    mutate: mutateBooks,
  } = useSWR("/api/book/stats", () => apiClient.getBooks(1, 1000), {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
    shouldRetryOnError: false,
  })

  const {
    data: chaptersData,
    isLoading: chaptersLoading,
    error: chaptersError,
    mutate: mutateChapters,
  } = useSWR("/api/chapter/stats", () => apiClient.getChapters(undefined, 1, 1000), {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
    shouldRetryOnError: false,
  })

  const {
    data: versesData,
    isLoading: versesLoading,
    error: versesError,
    mutate: mutateVerses,
  } = useSWR("/api/verse/stats", () => apiClient.getVerses(undefined, 1, 1000), {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
    shouldRetryOnError: false,
  })

  const { data: lastUpdatedData } = useSWR("/api/book/last-updated", () => apiClient.getLastUpdated(), {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
    shouldRetryOnError: false,
  })

  const isLoading = booksLoading || chaptersLoading || versesLoading
  const hasError = booksError || chaptersError || versesError

  const handleRetry = () => {
    mutateBooks()
    mutateChapters()
    mutateVerses()
  }

  const stats = {
    books: booksData?.totalCount || booksData?.data?.length || 0,
    chapters: chaptersData?.totalCount || chaptersData?.data?.length || 0,
    verses: versesData?.totalCount || versesData?.data?.length || 0,
    lastUpdated: lastUpdatedData?.data?.lastUpdated || null,
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor and manage your Scripture content database</p>
      </div>

      {hasError && <ApiErrorAlert error={booksError || chaptersError || versesError} onRetry={handleRetry} />}

      {isLoading && !hasError ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Books</CardTitle>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.books}</div>
                <p className="text-xs text-muted-foreground mt-1">Books in the database</p>
                <Link href="/books">
                  <Button variant="link" className="px-0 mt-2 h-auto text-xs">
                    Manage Books <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Chapters</CardTitle>
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-secondary-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.chapters}</div>
                <p className="text-xs text-muted-foreground mt-1">Chapters across all books</p>
                <Link href="/chapters">
                  <Button variant="link" className="px-0 mt-2 h-auto text-xs">
                    Manage Chapters <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Verses</CardTitle>
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                  <Quote className="h-5 w-5 text-accent-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.verses}</div>
                <p className="text-xs text-muted-foreground mt-1">Verses across all chapters</p>
                <Link href="/verses">
                  <Button variant="link" className="px-0 mt-2 h-auto text-xs">
                    Manage Verses <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Updated</CardTitle>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">{formatDate(stats.lastUpdated)}</div>
                <p className="text-xs text-muted-foreground mt-1">Most recent modification</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Welcome to Scripture Admin Dashboard</CardTitle>
                <CardDescription>Comprehensive Scripture content management system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Use this dashboard to efficiently manage books, chapters, and verses in your Scripture database. You
                  have full control to create, edit, and delete content with a user-friendly interface designed for
                  productivity.
                </p>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Key Features</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      <span className="text-sm text-muted-foreground">Books Management with Covenant Organization</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      <span className="text-sm text-muted-foreground">Chapters Management by Book</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      <span className="text-sm text-muted-foreground">Individual Verse Editing</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      <span className="text-sm text-muted-foreground">Complete Data Export</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Navigate to different sections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/books" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Manage Books
                  </Button>
                </Link>
                <Link href="/chapters" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Chapters
                  </Button>
                </Link>
                <Link href="/verses" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Quote className="mr-2 h-4 w-4" />
                    Manage Verses
                  </Button>
                </Link>
                <Link href="/export" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
