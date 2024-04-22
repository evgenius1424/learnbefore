import { z } from "zod"

export type Message = {
  id: string
  userId: string
  text: string
  timestamp: string
}

export type MessageWithWords = Message & {
  words: Word[]
}

export const wordSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  timestamp: z.string(),
  word: z.string(),
  meaning: z.string(),
  translation: z.string().optional(),
  languageCode: z.string(),
  frequencyLevel: z.enum(["high", "medium", "low"]),
})

export type Word = z.infer<typeof wordSchema>