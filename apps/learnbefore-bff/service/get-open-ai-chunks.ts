import OpenAI from "openai"
import { ChatCompletionChunk } from "openai/resources"
import { Stream } from "openai/streaming"
import { APIPromise } from "openai/core"

export const getOpenAiChunks = (
  ai: OpenAI,
  promt: string,
  text: string,
): APIPromise<Stream<ChatCompletionChunk>> => {
  return ai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: promt },
      {
        role: "user",
        content: text,
      },
    ],
  })
}
