import { z } from "zod"

export type User = {
  id: string
  clerkUserId: string
}

export type Message = {
  id: string
  userId: string
  text: string
  timestamp: string
  words: Word[]
}

export const wordSchema = z.object({
  word: z.string(),
  meaning: z.string(),
  translation: z.string().optional(),
  languageCode: z.string(),
})

export type Word = z.infer<typeof wordSchema>
