"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@repo/ui/components/button"
import { createClient } from "@supabase/supabase-js"
import { useSession } from "@clerk/nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function Page() {
  const [count, setCount] = useState(0)
  const { session } = useSession()

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => {
      console.log("Token requested")
      session?.getToken().then((token) => {
        console.log("Token received", token)
      })
      return session ? session.getToken() : null
    }
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("test").select("id")
      console.log(data)
    }

    if (session) {
      fetchData()
    }
  }, [session, supabase]) // Re-fetch when the session changes

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
