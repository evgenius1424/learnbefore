import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { streamObject } from 'ai'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const wordSchema = z.object({
  word: z.string(),
  meaning: z.string(),
  translation: z.string().optional(),
  languageCode: z.string(),
})

const wordsResponseSchema = z.object({
  words: z.array(wordSchema)
})

function getPrompt(translationLanguage: string) {
  return `Please analyze the input text to extract valuable vocabulary, prioritizing words in three tiers:

1. High-complexity words:
   - Academic vocabulary (B1-C2 level)
   - Technical and specialized terms
   - Domain-specific terminology
   - Scientific and professional jargon
   - Abstract concepts
   - Literary or archaic terms

2. Medium-complexity words (B1-B2 level):
   - Less common everyday verbs (e.g., blaze, scatter, dodge)
   - Descriptive vocabulary (e.g., graceful, peculiar, vivid)
   - Phrasal verbs beyond basics
   - Nature and environment terms
   - Emotion and behavior words
   - Specific actions and processes
   - Words with multiple meanings
   - Common metaphorical usage
   - Words that native speakers use but learners often don't know

3. Contextually valuable words:
   - Words crucial for understanding the text's meaning
   - Topic-specific vocabulary
   - Words with cultural significance
   - Terms that often appear in media/news
   - Words with tricky usage patterns
   - Terms that often cause confusion for learners

Processing rules:
- Maintain original order of appearance
- Convert to dictionary form
- Remove duplicates while preserving first occurrence
- Consider word frequency in general usage (roughly 3000-15000 range for medium complexity)
- Include words that might seem simple to native speakers but are often unknown to learners

Format output as JSON:
{
  "words": [
    {
      "word": "[Original word]",
      "meaning": "[Definition in text language]",
      "translation": "[${translationLanguage} translation]",
      "languageCode": "[ISO 639-1 code]"
    }
  ]
}

Additional guidelines:
- Include words that appear in upper-intermediate textbooks
- Keep terms that might not be extremely complex but are still challenging for learners
- Consider including words that:
  * Have subtle usage differences from their synonyms
  * Are common in native speech but rare in learner vocabulary
  * Represent concepts that might be familiar but whose specific term might not be
  * Are frequently used in certain contexts but not necessarily in basic conversation`
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messageId, translationLanguage = 'Russian' } = await request.json()

  if (!messageId) {
    return new Response('Message ID is required', { status: 400 })
  }

  // Verify message belongs to user
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .select('text')
    .eq('id', messageId)
    .eq('user_id', userId)
    .single()

  if (messageError || !message) {
    return new Response('Message not found', { status: 404 })
  }

  try {
    const result = streamObject({
      model: openai('gpt-4o'),
      schema: wordsResponseSchema,
      prompt: `${getPrompt(translationLanguage)}

Text to analyze: ${message.text}`,
      onFinish: async ({ object }) => {
        // Save words to database when streaming is complete
        if (object?.words) {
          const wordsToInsert = object.words.map(word => ({
            message_id: messageId,
            word: word.word.toLowerCase(),
            meaning: word.meaning,
            translation: word.translation || '',
            language_code: word.languageCode
          }))

          await supabase
            .from('words')
            .insert(wordsToInsert)
        }
      }
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Error processing words:', error)
    return new Response('Internal server error', { status: 500 })
  }
}