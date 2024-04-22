import React, { useEffect, useRef, useState } from "react"
import { AppShell } from "../components/app-shell"
import { MessageWithWords, Word } from "@repo/types/words.ts"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@ui/components/ui/input.tsx"
import { Button } from "@ui/components/ui/button.tsx"

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("An error occurred while fetching the data.")
  }
  return res.json()
}

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<MessageWithWords[] | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState(null)
  const [sendInProgress, setSendInProgress] = useState(false)

  useEffect(() => {
    fetcher("/api/chat").then(setMessages).catch(setError)
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() === "") return

    setSendInProgress(true)

    const optimisticMessage: MessageWithWords = {
      id: "",
      userId: "user1",
      text: inputValue,
      timestamp: new Date().toISOString(),
      words: [],
    }

    setMessages((prevMessages = []) => [
      ...(prevMessages || []),
      optimisticMessage,
    ])

    const mock = false
    const sse = new EventSource(
      `/api/words?text=${encodeURIComponent(inputValue)}&mock=` + mock,
    )

    sse.onmessage = function (event) {
      const newEntity: MessageWithWords | Word = JSON.parse(event.data)
      if (!newEntity) {
        sse.close()
        setSendInProgress(false)
        return
      }
      setMessages((prevMessages = []) => {
        if ("words" in newEntity) {
          return (prevMessages || []).map((message) => {
            if (message.id === optimisticMessage.id) {
              return newEntity
            } else {
              return message
            }
          })
        } else {
          return (prevMessages || []).map((message) => {
            if (message.id === newEntity.messageId) {
              message.words.push(newEntity)
            }
            return message
          })
        }
      })
    }

    sse.onerror = function (err) {
      console.error("SSE connection error: ", err)
      sse.close()
      setSendInProgress(false)
    }

    setInputValue("")
  }

  if (error) return <div>Failed to load messages</div>
  if (!messages) return <div>Loading...</div>

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
              messages.map((message, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-start gap-2 w-full">
                    <div className="w-full rounded-lg bg-zinc-200 dark:bg-zinc-700 p-2 text-left">
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center w-full">
                    {message.words.map((word, index) => (
                      <Card
                        key={index}
                        className="bg-white shadow rounded-lg p-4"
                      >
                        <CardContent>
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="text-2xl text-center font-semibold text-gray-800">
                                {word.word}{" "}
                                {word.translation
                                  ? " - " + word.translation
                                  : null}
                              </p>
                              <p className="text-sm text-center text-gray-500">
                                {word.meaning}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </main>
      <footer className="border-t dark:border-zinc-700 p-4">
        <form onSubmit={handleSend}>
          <div className="flex items-center gap-2">
            <Input
              disabled={sendInProgress}
              className="flex-1"
              placeholder="Type text to find words to learn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Button disabled={sendInProgress} type="submit">
              Send
            </Button>
          </div>
        </form>
      </footer>
    </AppShell>
  )
}
