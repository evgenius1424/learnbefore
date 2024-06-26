import OpenAI from "openai"
import { startExpress } from "../src/start-express"
import { getWords } from "../src/get-words"
import { Message, User } from "../types"
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"
import { Store } from "../src/store"
import { splitText } from "../src/split-text"
import { equalsIgnoringCase } from "../src/equals-ignoring-case"
import expressAsyncHandler from "express-async-handler"
import { retryableGenerator } from "../src/retryable-generator"

declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Express {
    // eslint-disable-next-line no-unused-vars
    interface Request {
      auth: { userId: string }
    }
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const app = startExpress(parseInt(process.env.EXPRESS_PORT || "3000"))

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

app.get(
  "/api/chat",
  ClerkExpressRequireAuth(),
  expressAsyncHandler(async function (req, res) {
    try {
      const user = await getUser(req.auth.userId)
      const messages = await store.getUserMessages(user.id, 5)
      res.status(200).json(messages)
    } catch (error) {
      res.status(500).json({ message: "Error fetching chat messages" })
    }
  }),
)

app.post(
  "/api/messages",
  ClerkExpressRequireAuth(),
  expressAsyncHandler(async (req, res) => {
    const text = req.body.text
    if (!text || typeof text !== "string") {
      res
        .status(400)
        .json({ message: "'text' parameter is missing or of wrong type." })
      return
    }

    const user = await getUser(req.auth.userId)

    const message: Message = await store.createMessage({
      userId: user.id,
      text,
    })
    res.json({ messageId: message.id })
  }),
)

app.get(
  "/api/words",
  ClerkExpressRequireAuth(),
  expressAsyncHandler(async (req, res) => {
    const messageId = req.query.messageId
    if (!messageId || typeof messageId !== "string") {
      res
        .status(400)
        .json({ message: "'messageId' parameter is missing or of wrong type." })
      return
    }

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()

    const message = await store.getMessage(messageId)

    for (const chunk of splitText(message.text, 6000)) {
      for await (const word of retryableGenerator(() =>
        getWords(openai, chunk),
      )) {
        const isDuplicate = message.words.find((w) =>
          equalsIgnoringCase(w.word, word.word),
        )
        if (!isDuplicate) {
          message.words.push(word)
          res.write(`data: ${JSON.stringify(word)}\n\n`)
          res.flushHeaders()
        }
      }
    }

    await store.updateMessageWords(message.id, message.words)

    res.write(`data: ${JSON.stringify(null)}\n\n`)
    res.flushHeaders()
  }),
)

async function getUser(userId: string) {
  const cachedUser = cachedUsers[userId]

  if (cachedUser) {
    return cachedUser
  }

  const user = await store.findOrCreateUser(userId)
  cachedUsers[userId] = user
  return user
}
