"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@repo/ui/components/button"
import { createClient } from "@supabase/supabase-js"
import { useSession, useUser } from "@clerk/nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log("🔧 Supabase Config:", {
  url: supabaseUrl,
  anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "undefined"
})

// Create Supabase client with Clerk integration
const createSupabaseClient = (sessionToken?: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: sessionToken
        ? {
            Authorization: `Bearer ${sessionToken}`,
          }
        : {},
    },
  })
}

export default function Page() {
  const [count, setCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const { session, isLoaded: sessionLoaded } = useSession()
  const { user, isLoaded: userLoaded } = useUser()

  // Get session token for authenticated requests
  const getSessionToken = async () => {
    if (session) {
      try {
        // Try to get the supabase template token (silently fail if not configured)
        try {
          const token = await session.getToken({ template: "supabase" })
          if (token) {
            console.log("🔑 Got Supabase template token: ✅")
            return token
          }
        } catch (templateError) {
          // Silently handle template not found
          console.log("🔄 Supabase JWT template not configured, using default token")
        }

        // Fallback: get the default token
        const defaultToken = await session.getToken()
        console.log("🔑 Got default Clerk token:", defaultToken ? "✅" : "❌")
        return defaultToken
      } catch (error) {
        console.error("❌ Failed to get session token:", error)
        return null
      }
    }
    return null
  }

  // Test Supabase connection
  const testSupabaseConnection = async () => {
    console.log("🔌 Testing Supabase connection...")
    try {
      const token = await getSessionToken()
      const supabase = createSupabaseClient(token || undefined)

      const { data, error, status, statusText } = await supabase
        .from("test")
        .select("*")
        .limit(1)

      console.log("📊 Supabase test query result:", {
        data,
        error,
        status,
        statusText,
        hasToken: !!token
      })

      setDebugInfo((prev: any) => ({
        ...prev,
        supabaseTest: { data, error, status, statusText, hasToken: !!token }
      }))
    } catch (error) {
      console.error("❌ Supabase connection error:", error)
      setDebugInfo((prev: any) => ({
        ...prev,
        supabaseError: error
      }))
    }
  }

  const insertUserId = async (userId: string) => {
    console.log("👤 Attempting to insert/update user:", userId)
    try {
      const token = await getSessionToken()
      const supabase = createSupabaseClient(token || undefined)

      const { data, error, status, statusText } = await supabase
        .from("users")
        .upsert(
          {
            clerk_user_id: userId,
            email: user?.emailAddresses?.[0]?.emailAddress,
            first_name: user?.firstName,
            last_name: user?.lastName,
            image_url: user?.imageUrl,
            updated_at: new Date().toISOString()
          },
          { onConflict: "clerk_user_id" }
        )
        .select()

      console.log("✅ User upsert result:", {
        data,
        error,
        status,
        statusText,
        hasToken: !!token
      })

      setDebugInfo((prev: any) => ({
        ...prev,
        userUpsert: { data, error, status, statusText, hasToken: !!token }
      }))

      if (error) {
        console.error("❌ User upsert failed:", error)
        return
      }

      // Test fetching user preferences
      if (data?.[0]?.id) {
        const { data: prefsData, error: prefsError } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", data[0].id)

        console.log("🎨 User preferences:", { prefsData, prefsError })
        setDebugInfo((prev: any) => ({
          ...prev,
          userPreferences: { data: prefsData, error: prefsError }
        }))
      }
    } catch (error) {
      console.error("❌ Error inserting user:", error)
      setDebugInfo((prev: any) => ({
        ...prev,
        userUpsertError: error
      }))
    }
  }

  useEffect(() => {
    console.log("🔄 Page effect triggered")
    console.log("📝 Auth state:", {
      sessionLoaded,
      userLoaded,
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      sessionUserId: session?.user?.id
    })

    setDebugInfo({
      sessionLoaded,
      userLoaded,
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      sessionUserId: session?.user?.id,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
      timestamp: new Date().toISOString()
    })

    const runTests = async () => {
      // Always test Supabase connection
      await testSupabaseConnection()

      // Only try user operations if we have a user
      if (session?.user?.id) {
        console.log("🚀 User authenticated, proceeding with user operations")
        await insertUserId(session.user.id)
      } else {
        console.log("⏳ No authenticated user yet")
      }
    }

    if (sessionLoaded && userLoaded) {
      runTests()
    }
  }, [session, user, sessionLoaded, userLoaded])

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

      {/* Debug Panel */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">🐛 Debug Information</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Clerk Authentication:</h3>
            <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify({
                sessionLoaded: debugInfo.sessionLoaded,
                userLoaded: debugInfo.userLoaded,
                hasSession: debugInfo.hasSession,
                hasUser: debugInfo.hasUser,
                userId: debugInfo.userId,
                userEmail: debugInfo.userEmail
              }, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Supabase Connection Test:</h3>
            <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(debugInfo.supabaseTest || debugInfo.supabaseError || "Not tested yet", null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">User Upsert Result:</h3>
            <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(debugInfo.userUpsert || debugInfo.userUpsertError || "Not attempted yet", null, 2)}
            </pre>
          </div>

          {debugInfo.userPreferences && (
            <div>
              <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">User Preferences (Related Table):</h3>
              <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded mt-1 overflow-auto">
                {JSON.stringify(debugInfo.userPreferences, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={testSupabaseConnection}
            >
              Test Supabase
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => session?.user?.id && insertUserId(session.user.id)}
              disabled={!session?.user?.id}
            >
              Test User Insert
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
