import { createServer, hasMany, belongsTo, Model, Factory } from "miragejs"
import { Message, Word, MessageWithWords } from "@repo/types/words"
import { faker } from "@faker-js/faker"

export default function makeServer() {
  createServer({
    models: {
      message: Model.extend<Partial<Message>>({}),
      word: Model.extend<Partial<Word>>({}),
    },
    factories: {
      message: Factory.extend<Partial<Message>>({
        text: () => faker.lorem.sentence(),
        timestamp: () => new Date().toISOString(),
      }),
      word: Factory.extend<Partial<Word>>({
        word: () => faker.word.words(),
        meaning: () => faker.lorem.sentence(),
        translatedMeaning: () => faker.lorem.sentence(),
        context: () => faker.lorem.sentence(),
        timestamp: () => new Date().toISOString(),
        languageCode: () => "en",
        frequencyInLanguage: () =>
          faker.helpers.arrayElement(["high", "medium", "low"]),
      }),
    },
    seeds(server) {
      const firstMessage = server.create("message", { userId: "1" })
      const secondMessage = server.create("message", { userId: "1" })

      for (let i = 0; i < 3; i++) {
        server.create("word", { messageId: firstMessage.id })
        server.create("word", { messageId: secondMessage.id })
      }
    },
    routes() {
      this.namespace = "api"

      this.get("/messages", (schema, request) => {
        const page = Number(request.queryParams.page) || 1
        const limit = Number(request.queryParams.limit) || 10

        const messageModels = schema.all("message").models as Message[]

        const total = messageModels.length
        const total_pages = Math.ceil(total / limit)

        const wordModels = schema.all("word").models as Word[]

        const messages = messageModels.map<MessageWithWords>((message) => {
          return {
            ...message,
            words: wordModels.filter((word) => word.messageId === message.id),
          }
        })

        return {
          page,
          total_pages,
          messages,
        }
      })
    },
  })
}
