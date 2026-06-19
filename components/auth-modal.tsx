"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { setToken } from "@/lib/api"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "login" | "signup" | "forgot-password"
  onSwitchMode?: (mode: "login" | "signup" | "forgot-password") => void
}

export function AuthModal({
  isOpen,
  onClose,
  mode,
  onSwitchMode,
}: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher", // ✅ added role
  })

  // OTP-based Password Reset State
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "reset">("email")
  const [otpToken, setOtpToken] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [userInputOtp, setUserInputOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const resetForgotFlow = () => {
    setForgotStep("email")
    setOtpToken("")
    setResetToken("")
    setUserInputOtp("")
    setNewPassword("")
    setConfirmPassword("")
  }

  useEffect(() => {
    resetForgotFlow()
    setError("")
    setSuccess("")
  }, [mode, isOpen])

  if (!isOpen) return null


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      if (mode === "forgot-password") {
        if (forgotStep === "email") {
          // STEP 1: Request OTP
          const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email }),
          })

          const data = await response.json()
          if (data.success) {
            setOtpToken(data.otpToken)
            setSuccess("OTP has been sent to your email. Please check your inbox.")
            setForgotStep("otp")
          } else {
            setError(data.message || "Failed to send OTP.")
          }
        } else if (forgotStep === "otp") {
          // STEP 2: Verify OTP
          const response = await fetch("/api/auth/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              otp: userInputOtp,
              otpToken,
            }),
          })

          const data = await response.json()
          if (data.success) {
            setResetToken(data.resetToken)
            setSuccess("OTP verified! You can now create your new password.")
            setForgotStep("reset")
          } else {
            setError(data.message || "Invalid or expired OTP.")
          }
        } else if (forgotStep === "reset") {
          // STEP 3: Reset Password
          if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.")
            setIsLoading(false)
            return
          }
          if (newPassword !== confirmPassword) {
            setError("Passwords do not match.")
            setIsLoading(false)
            return
          }

          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              token: resetToken,
              newPassword,
            }),
          })

          const data = await response.json()
          if (data.success) {
            setSuccess("Password reset successful! Redirecting you to login...")
            setTimeout(() => {
              onSwitchMode?.("login")
              resetForgotFlow()
            }, 2000)
          } else {
            setError(data.message || "Failed to reset password.")
          }
        }
        setIsLoading(false)
        return
      }

      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : "/api/auth/signup"

      const body =
        mode === "login"
          ? { email: formData.email, password: formData.password }
          : formData

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)

        if (mode === "login") {
           const loggedInUser = data.user || data.admin
          if (data.token) {
            setToken(data.token)
            localStorage.setItem("userInfo", JSON.stringify(loggedInUser))
          }

          // ✅ Role-based redirect
          setTimeout(() => {
             const userRole = String(loggedInUser?.role || "").toLowerCase()
            window.location.href =
              userRole === "admin" ? "/dashboard" : "/teacherdashboard"
          }, 1200)
        } else if (mode === "signup") {
          // Auto login after signup, then redirect by role
          const signupEmail = formData.email
          const signupPassword = formData.password
          const selectedRole = String(formData.role || "teacher").toLowerCase()

          try {
            const loginResponse = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: signupEmail,
                password: signupPassword,
              }),
            })

            const loginData = await loginResponse.json()
            if (loginData?.success && loginData?.token) {
              const loggedInUser = loginData.user || loginData.admin
              setToken(loginData.token)
              localStorage.setItem("userInfo", JSON.stringify(loggedInUser))

              setTimeout(() => {
                const userRole = String(loggedInUser?.role || selectedRole).toLowerCase()
                window.location.href =
                  userRole === "admin" ? "/dashboard" : "/teacherdashboard"
              }, 1200)
              return
            }
          } catch {
            // Fallback below: show login form if auto-login fails
          }

          // Fallback to login mode when backend does not support immediate signin
          setFormData({
            name: "",
            email: "",
            password: "",
            role: "teacher",
          })

          // ✅ Switch to login
          setTimeout(() => {
            onSwitchMode?.("login")
          }, 1200)
        }
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === "login" ? "Login" : mode === "signup" ? "Create Account" : "Reset Password"}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name (Signup only) */}
          {mode === "signup" && (
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                name="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          {/* Email */}
          {(mode !== "forgot-password" || forgotStep === "email") ? (
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          ) : (
            <div className="space-y-2 bg-muted/40 p-3 rounded-md border border-border">
              <span className="text-xs text-muted-foreground block font-medium">Resetting password for</span>
              <span className="text-sm font-semibold">{formData.email}</span>
            </div>
          )}

          {/* OTP Input (Step 2 of Forgot Password) */}
          {mode === "forgot-password" && forgotStep === "otp" && (
            <div className="space-y-2">
              <Label>Enter 6-Digit OTP</Label>
              <Input
                type="text"
                maxLength={6}
                placeholder="Enter verification code"
                value={userInputOtp}
                onChange={(e) => setUserInputOtp(e.target.value)}
                required
              />
            </div>
          )}

          {/* New Password / Confirm Password (Step 3 of Forgot Password) */}
          {mode === "forgot-password" && forgotStep === "reset" && (
            <>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {/* Password */}
          {mode !== "forgot-password" && (
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
              />
              {mode === "login" && (
                <div className="text-right mt-1">
                  <span
                    onClick={() => onSwitchMode?.("forgot-password")}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Role (Signup only) */}
          {mode === "signup" && (
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                name="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
                className="w-full p-2 rounded-md bg-input border border-border"
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <p className="text-destructive text-sm text-center font-medium">{error}</p>
          )}
          {success && (
            <p className="text-emerald-500 text-sm text-center font-medium">{success}</p>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2 justify-center">
                <Spinner className="w-4 h-4" />
                {mode === "login"
                  ? "Logging in..."
                  : mode === "signup"
                  ? "Creating account..."
                  : forgotStep === "email"
                  ? "Sending OTP..."
                  : forgotStep === "otp"
                  ? "Verifying OTP..."
                  : "Updating password..."}
              </span>
            ) : mode === "login" ? (
              "Login"
            ) : mode === "signup" ? (
              "Create Account"
            ) : forgotStep === "email" ? (
              "Send OTP"
            ) : forgotStep === "otp" ? (
              "Verify OTP"
            ) : (
              "Update Password"
            )}
          </Button>
        </form>

        {/* Switch Mode */}
        <p className="text-sm text-center mt-4">
          {mode === "login" && (
            <>
              Don’t have an account?{" "}
              <span
                className="text-primary cursor-pointer"
                onClick={() => onSwitchMode?.("signup")}
              >
                Sign up
              </span>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <span
                className="text-primary cursor-pointer"
                onClick={() => onSwitchMode?.("login")}
              >
                Login
              </span>
            </>
          )}
          {mode === "forgot-password" && (
            <>
              Remember your password?{" "}
              <span
                className="text-primary cursor-pointer"
                onClick={() => onSwitchMode?.("login")}
              >
                Login
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}