import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

export async function createMessageFetcher(inputValue: string, sessionToken?: string) {
  const supabase = createSupabaseClient(sessionToken)

  return await supabase
    .from("messages")
    .insert({
      text: inputValue,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single()
}