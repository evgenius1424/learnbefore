import { Request, Response } from "express"
import dotenv from "dotenv"
import OpenAI from "openai"
import { getOpenAiChunks } from "../service/get-open-ai-chunks"
import jsonParser from "best-effort-json-parser"
import { startExpress } from "../service/start-express"
import { Stream } from "openai/streaming"
import { ChatCompletionChunk } from "openai/resources"
import { MessageWithWords } from "@repo/types/words"

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const server = startExpress(parseInt(process.env.PORT || "3000"))

server.get("/words", async (req: Request, res: Response) => {
  const text = req.query.text as string
  if (!text) {
    res.status(400).json({ error: "'text' parameter is not provided" })
    return
  }
  try {
    for await (const word of chunksToWords(
      await getOpenAiChunks(openai, prompt, text),
    )) {
      res.write(word)
    }
    res.end()
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

async function* chunksToWords(stream: Stream<ChatCompletionChunk>) {
  let data = ""
  for await (const part of stream) {
    data += part.choices[0].delta.content || ""
    const endIndex = data.indexOf("}")
    if (endIndex !== -1) {
      const startIndex = data.indexOf("{")
      const jsonObject = data.slice(startIndex, endIndex + 1)
      data = data.slice(endIndex + 1)
      try {
        yield jsonParser.parse(jsonObject)
      } catch (err) {
        console.error("Error while parsing JSON:", err)
        console.error("JSON String:", jsonObject)
      }
    }
  }
}

const prompt = `Given a text, your goal is to extract a diverse range of words that an average language learner might not know. 
The words should be converted to their dictionary forms, with duplicates removed. Avoid including names of people or places.

Output the results in valid JSON format, containing an array of objects with the following fields:

'word': The dictionary form of the word.
'meaning': A brief description of the word's meaning.
'translatedMeaning': Optional field to define the meaning in another language. The translation language is English.
'context': A piece of original context with this word.
'languageCode': The language code in RFC 5646.
'frequencyInLanguage': Indicating the frequency of the word in the language, with possible values: high, medium, low.

The output should contain 20-30 words, prioritized based on their importance for understanding the text. Start with less familiar words, progressing to those that are more crucial to understanding the text.
Do not use words which are not present in text.`

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

server.get("/api/chat", (req, res) => {
  return res.status(200).json([...chat])
})

server.post("/api/chat", async (req, res) => {
  const text = req.body.text
  if (!text || typeof text !== "string") {
    return res
      .status(400)
      .json({ message: "'text' parameter is missing or of wrong type." })
  }

  const newMessage: MessageWithWords = {
    id: crypto.randomUUID(),
    userId: "user1",
    text: text,
    timestamp: new Date().toISOString(),
    words: [],
  }

  chat.push(newMessage)

  const words = text.split(" ").map((word) => createWord(word, newMessage.id))

  for (const word of words) {
    await waitFor(500)
    const chatMessage = chat.find((m) => m.id === newMessage.id)
    if (chatMessage) {
      chatMessage.words.push(word)
    }
  }

  return res.status(200).json(newMessage)
})

function createWord(text: string, messageId: string) {
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

function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
