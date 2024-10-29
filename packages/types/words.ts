export type Message = {
  id: string
  userId: string
  text: string
  words: Word[]
  timestamp: string
}

export type Word = {
  word: string
  meaning: string
  translation: string
  languageCode: string
}
