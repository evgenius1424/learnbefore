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
  "Use only RFC8259 compliant compact JSON and help to extract big list of words from the text that the language learner is unlikely to know or that are crucial to the understanding of the text. Words should be converted to dictionary form. Duplicates, names of characters, persons or toponyms are not allowed." +
  "Words that do not exist in the text are not allowed. Returns an empty response if the text contains no words."

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
