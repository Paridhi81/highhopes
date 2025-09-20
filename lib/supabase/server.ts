import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const createServerClient = async () => {
  const cookieStore = await cookies()

  return createSupabaseServerClient("https://hrulzrqpyfywunqgbrku.supabase.co"
,"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhydWx6cnFweWZ5d3VucWdicmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMTQwNDYsImV4cCI6MjA3Mzg5MDA0Nn0.gI7lojc007n5jH4TdFBl4T9HD6Z_101wInYXF1MPsqA", {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

export async function createClient() {
  return createServerClient()
}
