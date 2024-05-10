import OpenAI from "openai"
import { startExpress } from "../src/start-express"
import { getWords } from "../src/get-words"
import { MessageWithWords } from "../types"
import { waitFor } from "../src/wait-for"

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
        translation: "Здравствуйте",
        languageCode: "en",
      },
    ],
  },
}

server.get("/api/chat", (req, res) =>
  res.status(200).json(Object.values(chat).slice(-10)),
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
    for (const word of text.split(" ").map((word) => ({
      id: crypto.randomUUID(),
      messageId,
      timestamp: new Date().toISOString(),
      word: word,
      meaning: "Meaning of " + word,
      translation: "Translation of " + word + " in other language",
      languageCode: "en",
      frequencyLevel: "high" as const,
    }))) {
      await waitFor(500)
      newMessage.words.push(word)
      res.write(`data: ${JSON.stringify(word)}\n\n`)
      res.flushHeaders()
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
