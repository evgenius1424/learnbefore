import React, { useState } from "react"
import { AppShell } from "../components/app-shell"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"

type WordDefinition = {
  word: string
  meaning: string
  language: string
  frequency: "high" | "medium" | "low"
}

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<(string | WordDefinition)[]>([])
  const [inputValue, setInputValue] = useState("")

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() === "") return
    setMessages((prev) => [...prev, inputValue])
    try {
      const response = await fetch(
        "http://localhost:3000/words?text=" + encodeURIComponent(inputValue),
      )
      // noinspection TypeScriptValidateTypes
      const reader = response.body?.getReader()
      if (!reader) {
        console.error("ReadableStream not available")
        return
      }

      const readStream: () => Promise<unknown> = async () => {
        const { done, value } = await reader.read()
        if (done) return
        const textValue = new TextDecoder().decode(value)
        const definition: WordDefinition = JSON.parse(textValue)
        setMessages((prevMessages) => [...prevMessages, definition])

        return readStream()
      }

      await readStream()
      setInputValue("")
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  return (
    <AppShell>
      <main className="relative h-full w-full flex-1 overflow-auto transition-width">
        <div className="container flex flex-col h-[80vh] rounded-lg mx-auto">
          <div className="space-y-4 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-3xl font-semibold text-gray-800 mb-4">
                  Welcome to Learnbefore
                </h1>
                <p className="text-lg text-center text-gray-500 mb-8">
                  Start discovering new words by typing in the input field
                  below!
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                if (typeof message === "string") {
                  return (
                    <div key={index} className="flex items-start gap-2 w-full">
                      <div className="w-full rounded-lg bg-zinc-200 dark:bg-zinc-700 p-2 text-left">
                        <p className="text-sm">{message}</p>
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div
                      key={index}
                      className="flex flex-wrap gap-2 justify-center w-full"
                    >
                      <Card
                        key={message.word}
                        className="bg-white shadow rounded-lg p-4"
                      >
                        <CardContent>
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="text-2xl text-center font-semibold text-gray-800">
                                {message.word}
                              </p>
                              <p className="text-sm text-center text-gray-500">
                                {message.meaning}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                }
              })
            )}
          </div>
        </div>
      </main>
      <footer className="border-t dark:border-zinc-700 p-4">
        <form onSubmit={handleSend}>
          <div className="flex items-center gap-2">
            <Input
              className="flex-1"
              placeholder="Type text to find words to learn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Button type="submit">Send</Button>
          </div>
        </form>
      </footer>
    </AppShell>
  )
}
