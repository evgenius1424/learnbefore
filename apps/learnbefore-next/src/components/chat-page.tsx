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
import { StreamingMessage } from "./streaming-message"
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

  const handleWordsUpdate = (messageId: string, words: Word[]) => {
    setMessages((prev = []) => {
      return (prev || []).map((message) =>
        message.id === messageId
          ? { ...message, words }
          : message
      )
    })
  }

  const handleStreamingComplete = () => {
    setSendInProgress(false)
  }

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
          .select(`
            id,
            user_id,
            text,
            timestamp,
            words (
              word,
              meaning,
              translation,
              language_code
            )
          `)
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

        // Transform the data to match the expected format
        const transformedMessages = (data || []).map(message => ({
          id: message.id,
          userId: message.user_id,
          text: message.text,
          timestamp: message.timestamp,
          words: message.words.map((word: { word: string; meaning: string; translation: string; language_code: string }) => ({
            word: word.word,
            meaning: word.meaning,
            translation: word.translation,
            languageCode: word.language_code
          }))
        }))

        setMessages(transformedMessages)
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

      // Update the optimistic message with the real message from database
      setMessages((prev = []) => {
        return (prev || []).map((message) =>
          message.id === optimisticMessage.id
            ? { ...messageData, words: [] }
            : message
        )
      })

    } catch (error) {
      console.error("Error in handleSend:", error)
      setSendInProgress(false)
    } finally {
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
                <StreamingMessage
                  key={message.id || messageIndex}
                  message={message}
                  onWordsUpdate={handleWordsUpdate}
                  onComplete={handleStreamingComplete}
                  isExpanded={isMessageExpanded(message)}
                  toggleExpand={() => toggleExpand(message.id)}
                />
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

