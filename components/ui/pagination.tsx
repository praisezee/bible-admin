"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalCount?: number
  pageSize?: number
}

export function Pagination({ currentPage, totalPages, onPageChange, totalCount, pageSize }: PaginationProps) {
  const startItem = totalCount ? (currentPage - 1) * (pageSize || 20) + 1 : 0
  const endItem = totalCount ? Math.min(currentPage * (pageSize || 20), totalCount) : 0

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        {totalCount ? (
          <>
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span>{" "}
            of <span className="font-medium">{totalCount}</span> results
          </>
        ) : (
          `Page ${currentPage} of ${totalPages}`
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{currentPage}</span>
          <span className="text-sm text-muted-foreground">of</span>
          <span className="text-sm font-medium">{totalPages}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </Button>
      </div>
    </div>
  )
}
