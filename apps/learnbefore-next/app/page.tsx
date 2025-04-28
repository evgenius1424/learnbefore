"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@repo/ui/components/button"
import { createClient } from "@supabase/supabase-js"
import { useSession } from "@clerk/nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Page() {
  const [count, setCount] = useState(0)
  const { session } = useSession()

  const insertUserId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .upsert({ clerk_user_id: userId }, { onConflict: "clerk_user_id" })

      if (error) throw error
      console.log("User inserted or updated:", data)
    } catch (error) {
      console.error("Error inserting user:", error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("test").select("id")
      console.log(data)
    }

    const createOrUpdateUser = async () => {
      if (session) {
        const userId = session.user.id
        await insertUserId(userId) // Insert the user ID from Clerk
      }
    }

    if (session) {
      fetchData()
      createOrUpdateUser()
    }
  }, [session])

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-2">This is a Next.js application</h1>
      <p className="mb-4">
        This shadcn/ui button is shared between Next.js, Vite, and any other
        application.
      </p>
      <Button onClick={() => setCount((count) => count + 1)}>
        Count is {count}
      </Button>
    </main>
  )
}
