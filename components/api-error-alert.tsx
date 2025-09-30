"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ApiErrorAlertProps {
  error: any
  onRetry?: () => void
  title?: string
}

export function ApiErrorAlert({ error, onRetry, title = "Connection Error" }: ApiErrorAlertProps) {
  const errorMessage = error?.message || "Failed to connect to the API"
  const isConnectionError = errorMessage.includes("Cannot connect to API")

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">{errorMessage}</p>
        {isConnectionError && (
          <div className="text-sm space-y-2 bg-destructive/10 p-3 rounded-md border border-destructive/20">
            <p className="font-medium">To fix this issue:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Make sure your backend API server is running</li>
              <li>
                Set the <code className="bg-background px-1 py-0.5 rounded">NEXT_PUBLIC_API_BASE_URL</code> environment
                variable
              </li>
              <li>Check that the API endpoints match your backend implementation</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              Current API URL:{" "}
              <code className="bg-background px-1 py-0.5 rounded">
                {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}
              </code>
            </p>
          </div>
        )}
        {onRetry && (
          <div className="flex gap-2 mt-3">
            <Button onClick={onRetry} size="sm" variant="outline">
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry Connection
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
