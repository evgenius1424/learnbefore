import { http, HttpResponse } from "msw"
import { MessageWithWords } from "@repo/types/words.ts"

const encoder = new TextEncoder()

const chat: MessageWithWords[] = [
  {
    id: "1",
    userId: "user1",
    text: "Hello",
    timestamp: "2024-01-01T00:00:01Z",
    words: [
      {
        id: "word1",
        messageId: "1",
        timestamp: "2024-01-01T00:00:01Z",
        word: "Hello",
        meaning: "A greeting or expression of goodwill.",
        translatedMeaning: "Un saludo o expresión de buena voluntad.",
        context: "Used to greet someone.",
        languageCode: "EN",
        frequencyInLanguage: "high",
      },
    ],
  },
]

export const handlers = [
  http.get("*", ({ request }) => {
    if (request.url.startsWith("/node_modules/")) {
      return
    }
  }),
  http.get("/api/chat", () => {
    return HttpResponse.json([...chat])
  }),

  http.post("/api/chat", async ({ request }) => {
    const { text } = (await request.json()) as Record<string, unknown>
    if (!text || typeof text !== "string") {
      return HttpResponse.json(
        {
          message: "'text' parameter is missing or of wrong type.",
        },
        { status: 400 },
      )
    }

    const stream = new ReadableStream({
      async start(controller) {
        const newMessage: MessageWithWords = {
          id: crypto.randomUUID(),
          userId: "user1",
          text: text,
          timestamp: new Date().toISOString(),
          words: [],
        }

        chat.push(newMessage)
        controller.enqueue(encoder.encode(JSON.stringify(newMessage)))
        const words = text
          .split(" ")
          .map((word) => createWord(word, newMessage.id))

        for (const word of words) {
          await waitFor(500)
          chat.find((m) => m.id === newMessage.id)?.words.push(word)
          controller.enqueue(encoder.encode(JSON.stringify(word)))
        }

        controller.close()
      },
    })

    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/plain" },
    })
  }),
]

const createWord = (text: string, messageId: string) => {
  return {
    id: crypto.randomUUID(),
    messageId,
    timestamp: new Date().toISOString(),
    word: text,
    meaning: "Meaning of " + text,
    translatedMeaning: "Meaning of " + text + " in other language",
    context: "Used in the context of " + text,
    languageCode: "EN",
    frequencyInLanguage: "high" as const,
  }
}

const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
