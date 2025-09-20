import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/role-selection")
  }

  // Get user profile to determine dashboard redirect
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role === "scientist") {
    redirect("/scientist/dashboard")
  } else if (profile?.role === "policy_maker") {
    redirect("/policy-maker/dashboard")
  } else if (profile?.role === "researcher") {
    redirect("/researcher/dashboard")
  }

  redirect("/auth/role-selection")
}
