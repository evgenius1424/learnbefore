import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      user_id,
      text,
      timestamp,
      words (
        id,
        word,
        meaning,
        translation,
        language_code
      )
    `)
    .eq('user_id', userId)
    .order('timestamp', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Transform the data to match the expected format
  const transformedMessages = messages.map(message => ({
    id: message.id,
    userId: message.user_id,
    text: message.text,
    timestamp: message.timestamp,
    words: message.words.map(word => ({
      word: word.word,
      meaning: word.meaning,
      translation: word.translation,
      languageCode: word.language_code
    }))
  }))

  return Response.json(transformedMessages)
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { text } = await request.json()

  if (!text) {
    return Response.json({ error: 'Text is required' }, { status: 400 })
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      text
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ messageId: message.id })
}