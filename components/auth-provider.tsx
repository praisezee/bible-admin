"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}
