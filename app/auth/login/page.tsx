"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const role = searchParams.get("role") || "scientist"
  const isDemo = searchParams.get("demo") === "true"

  // Demo credentials
  const demoCredentials = {
    scientist: { email: "scientist@hmpi.com", password: "scientist123" },
    policy_maker: { email: "policy@hmpi.com", password: "policy123" },
    researcher: { email: "researcher@hmpi.com", password: "researcher123" },
  }

  useEffect(() => {
    if (isDemo && role in demoCredentials) {
      const creds = demoCredentials[role as keyof typeof demoCredentials]
      setEmail(creds.email)
      setPassword(creds.password)
    }
  }, [isDemo, role])

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "policy_maker":
        return {
          title: "Policy Maker Login",
          description: "Access your policy configuration and safety threshold management features",
          icon: (
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
          bgColor: "bg-blue-100",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
        }
      case "researcher":
        return {
          title: "Researcher Login",
          description: "Access your visualization tools, published reports, and trend analysis features",
          icon: (
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          ),
          bgColor: "bg-purple-100",
          buttonColor: "bg-purple-600 hover:bg-purple-700",
        }
      default: // scientist
        return {
          title: "Scientist Login",
          description: "Access your research tools and data analysis features",
          icon: (
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z"
              />
            </svg>
          ),
          bgColor: "bg-teal-100",
          buttonColor: "bg-teal-600 hover:bg-teal-700",
        }
    }
  }

  const config = getRoleConfig(role)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Redirect based on role
      if (role === "scientist") {
        router.push("/scientist/dashboard")
      } else if (role === "policy_maker") {
        router.push("/policy-maker/dashboard")
      } else if (role === "researcher") {
        router.push("/researcher/dashboard")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Back to role selection */}
          <Link
            href="/auth/role-selection"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to role selection
          </Link>

          <Card>
            <CardHeader className="text-center">
              <div className={`w-16 h-16 ${config.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                {config.icon}
              </div>
              <CardTitle className="text-2xl">{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {isDemo && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Demo Credentials:</strong>
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {demoCredentials[role as keyof typeof demoCredentials].email}
                  </p>
                  <p className="text-xs text-yellow-700">User: Dr. Sarah Johnson</p>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="scientist@hmpi.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className={`w-full ${config.buttonColor} text-white`} disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Need access?{" "}
                  <Link href="#" className="text-teal-600 hover:underline">
                    Contact administrator
                  </Link>
                </div>
              </form>

              {!isDemo && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2">Other demo accounts:</p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Policy Maker: policy@hmpi.com</p>
                    <p>Researcher: researcher@hmpi.com</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
