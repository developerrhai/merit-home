"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      setToken(params.get("token"))
      setEmail(params.get("email"))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!token || !email) {
      setError("Invalid or expired reset session. Please request a new link.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || "Password has been successfully updated.")
        setTimeout(() => {
          router.replace("/?login=true")
        }, 3000)
      } else {
        setError(data.message || "Failed to reset password. The link might be invalid or expired.")
      }
    } catch (err) {
      setError("Something went wrong. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  // If parameters are missing
  const isInvalidSession = !token || !email

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background blobs for premium glassmorphism vibe */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-2xl backdrop-blur-sm">
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <KeyRound size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Create New Password</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {email ? `Resetting password for ${email}` : "Enter your new credentials below"}
        </p>

        {isInvalidSession && !success && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Invalid Reset Link</p>
              <p className="text-muted-foreground mt-1">
                This link is missing critical security tokens. Please request a new link from the login page.
              </p>
            </div>
          </div>
        )}

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-500">Success!</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {success}
            </p>
            <p className="text-xs text-muted-foreground animate-pulse">
              Redirecting you to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isInvalidSession || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isInvalidSession || loading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base mt-2"
              disabled={isInvalidSession || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating password...
                </span>
              ) : (
                "Update Password"
              )}
            </Button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => router.replace("/")}
                className="text-sm text-primary hover:underline"
              >
                Back to Home
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
