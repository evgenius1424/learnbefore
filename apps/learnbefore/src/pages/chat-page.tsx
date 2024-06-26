import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { AppShell } from "../components/app-shell"
import { Message, Word } from "@repo/types/words.ts"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@ui/components/ui/input.tsx"
import { Button } from "@ui/components/ui/button.tsx"
import { PaperclipIcon } from "../icons/paperclip-icon.tsx"
import { getTextFromFile } from "../helpers/get-text-from-file.ts"
import { createMessageFetcher } from "../helpers/fetchers.ts"
import { useTranslation } from "react-i18next"
import { fetchJson } from "../helpers/fetch-json.ts"

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
  } = useFileUpload(setInputValue)

  const toggleExpand = (messageId: string) => {
    if (expandedMessages.includes(messageId)) {
      setExpandedMessages((prev) => prev.filter((id) => id !== messageId))
    } else {
      setExpandedMessages((prev) => [...prev, messageId])
    }
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
              <WelcomeMessage />
            ) : (
              messages.map((message, messageIndex) => (
                <React.Fragment key={messageIndex}>
                  <div className="flex items-start gap-2 w-full">
                    <div className="w-full rounded-lg bg-zinc-200 dark:bg-zinc-700 p-2 text-left">
                      <p className="text-sm">
                        {message.text.length > 1000 &&
                        !isMessageExpanded(message)
                          ? message.text.substring(0, 1000).trim() + "... "
                          : message.text}
                        {message.text.length > 1000 && (
                          <button
                            className="text-blue-500"
                            onClick={() => toggleExpand(message.id)}
                          >
                            {isMessageExpanded(message)
                              ? t("Show less")
                              : t("Show more")}
                          </button>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center w-full">
                    {message.words.map((word, wordIndex) => (
                      <WordCard key={wordIndex} word={word} />
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
              placeholder={t("Type text to find words to learn...")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <label>
              <Button
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

const WordCard: React.FC<{ word: Word }> = ({ word }) => (
  <Card className="bg-white shadow rounded-lg p-4">
    <CardContent>
      <div className="flex items-center space-x-4">
        <div>
          <p className="text-2xl text-center font-semibold text-gray-800">
            {word.word}
            {word.translation?.length > 2 ? ` - ${word.translation}` : null}
          </p>
          <p className="text-sm text-center text-gray-500">{word.meaning}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

const WelcomeMessage = () => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-3xl font-semibold text-gray-800 mb-4">
        {t("Welcome to Learnbefore")}
      </h1>
      <p className="text-lg text-gray-500 mb-8">
        {t("Start discovering new words by typing in the input field below!")}
      </p>
    </div>
  )
}

const useFileUpload = (handleTextUpload: (text: string) => void) => {
  const [fileUploadInProgress, setFileUploadInProgress] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUploadClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    fileInputRef.current?.click()
  }, [])

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    try {
      setFileUploadInProgress(true)
      const text = await getTextFromFile(e.target.files[0])
      handleTextUpload(text)
    } finally {
      setFileUploadInProgress(false)
    }
  }

  return {
    fileUploadInProgress,
    fileInputRef,
    handleFileUploadClick,
    handleFileUpload,
  }
}

const useScrollToRef = (dependency: unknown) => {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(
    () => ref.current?.scrollIntoView({ behavior: "smooth" }),
    [dependency],
  )

  return ref
}
