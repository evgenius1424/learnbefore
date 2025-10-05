"use client"
import React, { useEffect, useState } from "react"
import { AppShell } from "./app-shell"
import { Message, Word } from "@repo/types/words"
import { Input } from "@repo/ui/components/input"
import { Button } from "@repo/ui/components/button"
import { PaperclipIcon } from "../icons/paperclip-icon"
import { useTranslation } from "react-i18next"
import { useScrollToRef } from "../helpers/use-scroll-to-ref"
import { useTextFileUpload } from "../helpers/use-text-file-upload"
import { ChatWelcomeMessage } from "./chat-welcome-message"
import { WordCard } from "./word-card"
import { createClient } from "@supabase/supabase-js"
import { useSession } from "@clerk/nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const createSupabaseClient = (sessionToken?: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: sessionToken
        ? {
            Authorization: `Bearer ${sessionToken}`,
          }
        : {},
    },
  })
}

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<Error | null>(null)
  const [sendInProgress, setSendInProgress] = useState(false)
  const [expandedMessages, setExpandedMessages] = useState<string[]>([])
  const messagesEndRef = useScrollToRef(messages)
  const { t } = useTranslation()
  const { session } = useSession()

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
    const getSessionToken = async () => {
      if (session) {
        try {
          try {
            const token = await session.getToken({ template: "supabase" })
            if (token) return token
          } catch {
            // Silently handle template not found
          }
          const defaultToken = await session.getToken()
          return defaultToken
        } catch (error) {
          console.error("Failed to get session token:", error)
          return null
        }
      }
      return null
    }

    const loadMessages = async () => {
      try {
        const token = await getSessionToken()
        const supabase = createSupabaseClient(token || undefined)

        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .order("timestamp", { ascending: true })

        if (error) {
          console.error("Error loading messages:", error)
          // If the table doesn't exist, just set empty messages array
          if (error.code === "42P01" || error.message.includes("does not exist")) {
            console.log("Messages table doesn't exist yet, starting with empty state")
            setMessages([])
            return
          }
          setError(new Error(error.message))
          return
        }

        // Add empty words array to each message for now
        const messagesWithWords = (data || []).map(message => ({
          ...message,
          words: [] as Word[]
        }))
        setMessages(messagesWithWords)
      } catch (err) {
        console.error("Error in loadMessages:", err)
        // If there's a connection issue, start with empty state
        setMessages([])
      }
    }

    loadMessages()
  }, [session])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() === "" || !session?.user?.id) return

    setSendInProgress(true)

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      userId: session.user.id,
      text: inputValue,
      timestamp: new Date().toISOString(),
      words: [],
    }

    setMessages((prev = []) => [...(prev || []), optimisticMessage])

    try {
      const getSessionToken = async () => {
        if (session) {
          try {
            try {
              const token = await session.getToken({ template: "supabase" })
              if (token) return token
            } catch {
              // Silently handle template not found
            }
            const defaultToken = await session.getToken()
            return defaultToken
          } catch (error) {
            console.error("Failed to get session token:", error)
            return null
          }
        }
        return null
      }

      const token = await getSessionToken()
      const supabase = createSupabaseClient(token || undefined)

      // Insert message into Supabase
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          text: inputValue,
          user_id: session.user.id,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single()

      if (messageError) {
        console.error("Error creating message:", messageError)
        // If table doesn't exist, just keep the optimistic message
        if (messageError.code === "42P01" || messageError.message.includes("does not exist")) {
          console.log("Messages table doesn't exist yet, keeping optimistic message")
          setSendInProgress(false)
          setInputValue("")
          return
        }
        setSendInProgress(false)
        return
      }

      // TODO: Replace this with actual AI integration for word analysis
      // For now, we'll simulate the word processing
      const simulatedWords: Word[] = []

      // Update the optimistic message with the real message from database
      setMessages((prev = []) => {
        return (prev || []).map((message) =>
          message.id === optimisticMessage.id
            ? { ...messageData, words: simulatedWords }
            : message
        )
      })

    } catch (error) {
      console.error("Error in handleSend:", error)
    } finally {
      setSendInProgress(false)
      setInputValue("")
    }
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
                <React.Fragment key={message.id || messageIndex}>
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