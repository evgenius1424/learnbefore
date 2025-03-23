import { Message, User, Word } from "../types"

export interface Store {
  getUserMessages(userId: string, limit?: number): Promise<Message[]>

  getMessage(messageId: string): Promise<Message>

  findOrCreateUser(clerkUserId: string): Promise<User>

  createMessage(
    message: Omit<Message, "id" | "timestamp" | "words">,
  ): Promise<Message>

  updateMessageWords(messageId: string, words: Word[]): Promise<void>

  clear(): Promise<void>

  connect(): Promise<void>
}
