import type React from "react"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"

export default async function ResearcherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "researcher") {
    redirect("/auth/role-selection")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole="researcher" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
