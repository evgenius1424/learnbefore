import OpenAI from "openai"
import { startExpress } from "../src/start-express"
import { getWords } from "../src/get-words"
import { Message, User, Word } from "../types"
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"
import { Store } from "../src/store" // Adjust the import path as necessary

declare global {
  namespace Express {
    interface Request {
      auth: { userId: string }
    }
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const app = startExpress(parseInt(process.env.PORT || "3000"))

const store = new Store(process.env.MONGO_CONNECTION_STRING!!)

const cachedUsers: Record<string, User> = {}
store
  .connect()
  .then(() => {
    console.log("Connected to the database")
  })
  .catch((error) => {
    console.error("Failed to connect to the database", error)
    process.exit(1)
  })

app.get("/api/chat", ClerkExpressRequireAuth({}), async function (req, res) {
  try {
    const user = await getUser(req.auth.userId)
    const messages = await store.getUserMessages(user.id, 5)
    res.status(200).json(messages)
  } catch (error) {
    res.status(500).json({ message: "Error fetching chat messages" })
  }
})

app.get("/api/words", ClerkExpressRequireAuth({}), async (req, res) => {
  const text = req.query.text
  if (!text || typeof text !== "string") {
    return res
      .status(400)
      .json({ message: "'text' parameter is missing or of wrong type." })
  }

  const user = await getUser(req.auth.userId)

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()

  let message: Message

  const words: Word[] = []
  try {
    message = await store.createMessage({
      userId: user.id,
      text,
      words,
    })
  } catch (error) {
    return res.status(500).json({ message: "Error saving new message" })
  }

  res.write(`data: ${JSON.stringify(message)}\n\n`)
  res.flushHeaders()

  for await (const word of getWords(openai, text)) {
    words.push(word)
    res.write(`data: ${JSON.stringify(word)}\n\n`)
    res.flushHeaders()
  }

  try {
    await store.updateMessageWords(message.id, words)
  } catch (error) {
    return res.status(500).json({ message: "Error updating message" })
  }

  res.write(`data: ${JSON.stringify(null)}\n\n`)
  res.flushHeaders()
})

async function getUser(userId: string) {
  const cachedUser = cachedUsers[userId]

  if (cachedUser) {
    return cachedUser
  }

  const user = await store.findOrCreateUser(userId)
  cachedUsers[userId] = user
  return user
}

const authorizedParties = ["http://localhost:3000", "https://learnbefore.com"]

app.use(ClerkExpressRequireAuth({ authorizedParties }))
