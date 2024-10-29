import { parse } from "best-effort-json-parser"
import OpenAI from "openai"
import { Word, wordSchema } from "../types"

export async function* getWords(
  openAI: OpenAI,
  text: string,
  translationLanguage: string = "Russian",
): AsyncGenerator<Word> {
  let data = ""
  for await (const part of await openAI.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    max_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: getPrompt(translationLanguage) },
      {
        role: "user",
        content: text,
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

function getPrompt(translationLanguage: string) {
  return `Please analyze the input text to extract valuable vocabulary, prioritizing words in three tiers:

1. High-complexity words:
   - Academic vocabulary (B1-C2 level)
   - Technical and specialized terms
   - Domain-specific terminology
   - Scientific and professional jargon
   - Abstract concepts
   - Literary or archaic terms

2. Medium-complexity words (B1-B2 level):
   - Less common everyday verbs (e.g., blaze, scatter, dodge)
   - Descriptive vocabulary (e.g., graceful, peculiar, vivid)
   - Phrasal verbs beyond basics
   - Nature and environment terms
   - Emotion and behavior words
   - Specific actions and processes
   - Words with multiple meanings
   - Common metaphorical usage
   - Words that native speakers use but learners often don't know

3. Contextually valuable words:
   - Words crucial for understanding the text's meaning
   - Topic-specific vocabulary
   - Words with cultural significance
   - Terms that often appear in media/news
   - Words with tricky usage patterns
   - Terms that often cause confusion for learners

Processing rules:
- Maintain original order of appearance
- Convert to dictionary form
- Remove duplicates while preserving first occurrence
- Consider word frequency in general usage (roughly 3000-15000 range for medium complexity)
- Include words that might seem simple to native speakers but are often unknown to learners

Format output as JSON:
{
  "words": [
    {
      "word": "[Original word]",
      "meaning": "[Definition in text language]",
      "translation": "[${translationLanguage} translation]",
      "languageCode": "[ISO 639-1 code]"
    }
  ]
}

Additional guidelines:
- Include words that appear in upper-intermediate textbooks
- Keep terms that might not be extremely complex but are still challenging for learners
- Consider including words that:
  * Have subtle usage differences from their synonyms
  * Are common in native speech but rare in learner vocabulary
  * Represent concepts that might be familiar but whose specific term might not be
  * Are frequently used in certain contexts but not necessarily in basic conversation`
}
