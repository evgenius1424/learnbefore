import OpenAI from "openai"
import { startExpress } from "../service/start-express"
import { z } from "zod"
import { getWords } from "../service/get-words"

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const server = startExpress(parseInt(process.env.PORT || "3000"))

const dummyUserID = "<userId>"

/**
 * This chat object is an in-memory emulation of the database.
 * */
const chat: Record<string, MessageWithWords> = {
  "1": {
    id: "1",
    userId: dummyUserID,
    text: "Hello",
    timestamp: "2024-01-01T00:00:01Z",
    words: [
      {
        id: "word1",
        messageId: "1",
        timestamp: "2024-01-01T00:00:01Z",
        word: "Hello",
        meaning: "A greeting or expression of goodwill.",
        translation: "Un saludo o expresión de buena voluntad.",
        languageCode: "en",
        frequencyLevel: "high",
      },
    ],
  },
}

server.get("/api/chat", (req, res) =>
  res.status(200).json([...Object.values(chat)]),
)

server.get("/api/words", async (req, res) => {
  const text = req.query.text
  if (!text || typeof text !== "string") {
    return res
      .status(400)
      .json({ message: "'text' parameter is missing or of wrong type." })
  }

  const mock = req.query.mock === "true"

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()

  const messageId = crypto.randomUUID()
  const newMessage: MessageWithWords = {
    id: messageId,
    userId: dummyUserID,
    text,
    timestamp: new Date().toISOString(),
    words: [],
  }

  chat[messageId] = newMessage

  res.write(`data: ${JSON.stringify(newMessage)}\n\n`)
  res.flushHeaders()

  if (mock) {
    const waitFor = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    for (const word of text
      .split(" ")
      .map((word) => createDummyWord(word, messageId))) {
      await waitFor(500)
      const message = newMessage
      if (message) {
        message.words.push(word)
        res.write(`data: ${JSON.stringify(word)}\n\n`)
        res.flushHeaders()
      }
    }
  } else {
    for await (const word of getWords(messageId, openai, text)) {
      newMessage.words.push(word)
      res.write(`data: ${JSON.stringify(word)}\n\n`)
      res.flushHeaders()
    }
  }

  res.write(`data: ${JSON.stringify(null)}\n\n`)
  res.flushHeaders()
})

function createDummyWord(text: string, messageId: string): Word {
  return {
    id: crypto.randomUUID(),
    messageId,
    timestamp: new Date().toISOString(),
    word: text,
    meaning: "Meaning of " + text,
    translation: "Translation of " + text + " in other language",
    languageCode: "en",
    frequencyLevel: "high" as const,
  }
}
