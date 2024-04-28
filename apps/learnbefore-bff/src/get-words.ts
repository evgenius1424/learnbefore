import { parse } from "best-effort-json-parser"
import OpenAI from "openai"
import { Word, wordSchema } from "../types"

export async function* getWords(
  messageId: string,
  openAI: OpenAI,
  text: string,
): AsyncGenerator<Word> {
  let data = ""
  for await (const part of await openAI.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: getUserPrompt(text),
      },
    ],
  })) {
    data += part.choices[0].delta.content || ""
    const endIndex = data.indexOf("}")
    if (endIndex !== -1) {
      const startIndex = data.lastIndexOf("{")
      if (startIndex !== -1) {
        const jsonObject = data.slice(startIndex, endIndex + 1)
        data = data.slice(endIndex + 1)
        try {
          const word = {
            id: crypto.randomUUID(),
            messageId: messageId,
            timestamp: new Date().toISOString(),
            ...parse(jsonObject),
          }
          const zodParse = wordSchema.safeParse(word)
          if (zodParse.success) {
            yield word
          } else {
            console.error(`Zod validation error.`)
            console.error("Word validation error. " + zodParse.error.message)
            console.error(`Parsed content: `, word)
          }
        } catch (err) {
          console.error("Error while parsing JSON:", err)
          console.error("JSON String:", jsonObject)
        }
      }
    }
  }
}

const systemPrompt =
  "Use only RFC8259 compliant JSON and help to extract list of words from the text that the average language learner is unlikely to know or that are crucial to the understanding of the text. " +
  "Words should be converted to dictionary form. Duplicates, proper names, toponyms are not allowed." +
  "Words that do not exist in the text are not allowed."

function getUserPrompt(text: string) {
  return `
    Extract a lot of words from the text below which language learner likely do not know or need to know in order to understand the text. 
    Please ensure the extracted words are diverse and relevant to the context of the text.
    
    Example of list of words in JSON: 
    {
      words: [
        "word": "Hello",
        "meaning": "A greeting or expression of goodwill.",
        "translation": "Здравствуйте",
        "languageCode": "en",
        "frequencyLevel": "high"
      ]
    }
    
    "word" - dictionary form of the word
    "meaning" - meaning of the word 
    "translation" - translation of the word. Translation language is Russian.
    "languageCode" - ISO 639 language code for word itself, not a translation, e.g. 'en', 'ru', 'it' and so on.
    "frequencyLevel" - frequency of the word in language. only possible values: high, medium, low
      
    Text: ${text}`
}
