import { Db, MongoClient, ObjectId } from "mongodb"
import { Message, User, Word } from "../types"

export class Store {
  private db: Db | undefined

  constructor(private connectionString: string) {}

  public async getUserMessages(userId: string, limit = 10): Promise<Message[]> {
    const messages = await this.collection("messages")
    const res = await messages
      .find({ userId: new ObjectId(userId), words: { $ne: [] } })
      .project({ _id: 0, userId: 1, text: 1, timestamp: 1, words: 1 })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()

    return res
      .map((message) => ({
        ...message,
        userId: message.userId.toString(),
        timestamp: message.timestamp.toISOString(),
      }))
      .reverse() as Message[]
  }

  public async getMessage(messageId: string): Promise<Message> {
    const messages = await this.collection("messages")

    const message = await messages.findOne({ _id: new ObjectId(messageId) })
    if (!message) {
      throw new Error(`Message with id ${messageId} not found`)
    }
    const { _id: id, userId, text, timestamp, words } = message

    return {
      id: id.toString(),
      userId: userId.toString(),
      text,
      timestamp: timestamp.toISOString(),
      words,
    }
  }

  public async findOrCreateUser(clerkUserId: string): Promise<User> {
    const users = await this.collection("users")

    const res = await users.findOneAndUpdate(
      { clerkUserId },
      { $setOnInsert: { clerkUserId } },
      { returnDocument: "after", upsert: true },
    )
    if (!res) {
      throw new Error("Failed to find or create user")
    }
    const { _id: id, ...user } = res

    return { id: id.toString(), ...user } as User
  }

  public async createMessage(
    message: Omit<Message, "id" | "timestamp">,
  ): Promise<Message> {
    const messages = await this.collection("messages")
    const { userId, text, words } = message

    const timestamp = new Date()

    const result = await messages.insertOne({
      userId: new ObjectId(userId),
      text,
      timestamp,
      words,
    })

    return {
      id: result.insertedId.toString(),
      userId,
      text,
      timestamp: timestamp.toISOString(),
      words: words,
    }
  }

  public async updateMessageWords(
    messageId: string,
    words: Word[],
  ): Promise<void> {
    const messages = await this.collection("messages")
    await messages.updateOne(
      { _id: new ObjectId(messageId) },
      { $set: { words: words } },
    )
  }

  public async clear(): Promise<void> {
    const userCollection = await this.collection("users")
    const messageCollection = await this.collection("messages")

    await userCollection.deleteMany({})
    await messageCollection.deleteMany({})
  }

  public async connect(): Promise<Db> {
    if (this.db) return this.db

    try {
      const client = new MongoClient(this.connectionString, {})
      await client.connect()
      console.log("Connected to MongoDB")
      this.db = client.db("learnbefore")
      return this.db
    } catch (error) {
      console.error("Error connecting to MongoDB:", error)
      this.db = undefined
      throw error
    }
  }

  private async collection(collection: "users" | "messages") {
    const db = await this.connect()
    return db.collection(collection)
  }
}
