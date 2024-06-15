import { parse } from "best-effort-json-parser"
import OpenAI from "openai"
import { Word, wordSchema } from "../types"

export async function* getWords(
  openAI: OpenAI,
  text: string,
): AsyncGenerator<Word> {
  let data = ""
  for await (const part of await openAI.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    max_tokens: 4096,
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
          const zodParse = wordSchema.safeParse(parse(jsonObject))
          if (zodParse.success) {
            yield { ...zodParse.data, word: zodParse.data.word.toLowerCase() }
          } else {
            console.error(`Zod validation error.`)
            console.error("Word validation error. " + zodParse.error.message)
            console.error(`Parsed content: `, parse(jsonObject))
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
  "Use only RFC8259 compliant compact JSON. The aim is to extract a large list of words that a regular language learner is unlikely to know, but at the same time the word should be widely known. So avoid names of any kind, geo-locations or other proper nouns. Duplicates are not allowed, words should be provided in dictionary forms. " +
  "Words that do not exist in the text are not allowed. Returns an empty response if the text contains no words. " +
  "Good words: Coyly, teeming, attic, scorching - because these words are rarely used. " +
  "Bad words: Swiss Institute, Natalia - because they're not dictionary words, they're names."

function getUserPrompt(text: string, translationLanguage = "Russian") {
  return `
    You must extract 40 words from the text below which language learner likely do not know or need to know in order to understand the text. 
    Please ensure the extracted words are diverse and relevant to the context of the text.
    
    Translation language is ${translationLanguage}.
    
    Example of list of words in JSON: 
    {
      words: [
        "word": "Hello",                                      // The word itself.
        "meaning": "A greeting or expression of goodwill.",   // The definition or meaning of the word.
        "translation": "Здравствуйте",                        // Translation of the word.
        "languageCode": "en",                                 // ISO 639 Language code indicating the language of the word (e.g., "en" for English).
      ]
    }
      
    Text: ${text}`.trim()
}
