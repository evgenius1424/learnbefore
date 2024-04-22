export type Message = {
  id: string
  userId: string
  text: string
  timestamp: string
}

export type MessageWithWords = Message & {
  words: Word[]
}

export type Word = {
  id: string
  messageId: string
  timestamp: string
  word: string
  meaning: string
  translation: string
  context: string
  languageCode: string
  frequencyLevel: "high" | "medium" | "low"
}
