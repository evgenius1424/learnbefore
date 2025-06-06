import React, { useEffect, useState } from "react"
import { AppShell } from "../components/app-shell"
import { Message, Word } from "@repo/types/words.ts"
import { Input } from "@repo/ui/components/input"
import { Button } from "@repo/ui/components/button"
import { PaperclipIcon } from "../icons/paperclip-icon.tsx"
import { createMessageFetcher } from "../helpers/fetchers.ts"
import { useTranslation } from "react-i18next"
import { fetchJson } from "../helpers/fetch-json.ts"
import { useScrollToRef } from "../helpers/use-scroll-to-ref.ts"
import { useTextFileUpload } from "../helpers/use-text-file-upload.ts"
import { ChatWelcomeMessage } from "../components/chat-welcome-message.tsx"
import { WordCard } from "../components/word-card.tsx"

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState(null)
  const [sendInProgress, setSendInProgress] = useState(false)
  const [expandedMessages, setExpandedMessages] = useState<string[]>([])
  const messagesEndRef = useScrollToRef(messages)
  const { t } = useTranslation()

  const {
    fileUploadInProgress,
    fileInputRef,
    handleFileUploadClick,
    handleFileUpload,
  } = useTextFileUpload(setInputValue)

  const toggleExpand = (messageId: string) => {
    setExpandedMessages((prev) => {
      const isExpanded = prev.includes(messageId)
      return isExpanded
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    })
  }

  const isMessageExpanded = (message: Message) =>
    expandedMessages.includes(message.id)

  useEffect(() => {
    fetchJson("/api/chat").then(setMessages).catch(setError)
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() === "") return

    setSendInProgress(true)

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      userId: "",
      text: inputValue,
      timestamp: new Date().toISOString(),
      words: [],
    }

    setMessages((prev = []) => [...(prev || []), optimisticMessage])

    const createMessageResponse = await createMessageFetcher(inputValue)

    const { messageId } = await createMessageResponse.json()

    const sse = new EventSource(`/api/words?messageId=${messageId}`)

    sse.onmessage = function (event) {
      const messageOrWord: Message | Word | null = JSON.parse(event.data)

      if (!messageOrWord) {
        sse.close()
        setSendInProgress(false)
        return
      }

      setMessages((prev = []) => {
        if ("words" in messageOrWord) {
          return (prev || []).map((message) =>
            message.id === optimisticMessage.id ? messageOrWord : message,
          )
        } else {
          return (prev || []).map((message, index) => {
            if (index == (prev || []).length - 1) {
              message.words.push(messageOrWord)
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
  if (error) return <span>{JSON.stringify(error)}</span>

  return (
    <AppShell>
      <main className="flex-1 overflow-auto pt-14 pb-14">
        <div className="container flex flex-col h-full rounded-lg mx-auto pb-14">
          <div className="space-y-4 p-4">
            {messages === null ? null : messages.length === 0 ? (
              <ChatWelcomeMessage />
            ) : (
              messages.map((message, messageIndex) => (
                <React.Fragment key={messageIndex}>
                  <div className="flex items-start gap-2 w-full">
                    <div className="w-full rounded-lg bg-zinc-200 dark:bg-zinc-700 p-2 text-left">
                      <MessageText
                        text={message.text}
                        highlightWords={message.words}
                        isExpanded={isMessageExpanded(message)}
                        toggleExpand={() => toggleExpand(message.id)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center w-full">
                    {message.words.map((word, wordIndex) => (
                      <WordCard word={word} key={wordIndex} />
                    ))}
                  </div>
                </React.Fragment>
              ))
            )}
            <div ref={messagesEndRef}></div>
          </div>
        </div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 border-t dark:border-zinc-700 p-4 bg-white z-10">
        <form onSubmit={handleSend}>
          <div className="flex items-center gap-2">
            <Input
              disabled={sendInProgress}
              className="flex-1"
              placeholder={t(
                "Type in a few sentences or upload a file to find words for learning...",
              )}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleFileUploadClick}
                disabled={fileUploadInProgress || sendInProgress}
              >
                <PaperclipIcon className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                onChange={handleFileUpload}
                type="file"
                accept="image/jpeg, text/plain"
                className="hidden"
                aria-hidden="true"
              />
            </label>
            <Button disabled={sendInProgress} type="submit">
              {t("Send")}
            </Button>
          </div>
        </form>
      </footer>
    </AppShell>
  )
}

const MessageText: React.FC<{
  text: string
  highlightWords: Word[]
  isExpanded: boolean
  toggleExpand: () => void
}> = ({ text, highlightWords, isExpanded, toggleExpand }) => {
  const MAX_LENGTH = 1000
  const shouldTruncate = text.length > MAX_LENGTH

  const displayedText =
    shouldTruncate && !isExpanded
      ? text.substring(0, MAX_LENGTH).trim() + "... "
      : text

  const parts = displayedText.split(
    new RegExp(`(${highlightWords.map(({ word }) => word).join("|")})`, "gi"),
  )

  return (
    <div className="text-sm">
      {parts.map((part, index) => {
        const isMatch = highlightWords.some(
          ({ word }) => word.toLowerCase() === part.toLowerCase(),
        )
        return isMatch ? (
          <span key={index} className="bg-yellow-200 dark:bg-yellow-800">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      })}
      {shouldTruncate && (
        <button className="text-blue-500" onClick={toggleExpand}>
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}
