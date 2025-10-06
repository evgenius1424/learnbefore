"use client"
import React, { useEffect, useState, useCallback } from "react"
import { Message, Word } from "@repo/types/words"
import { WordCard } from "./word-card"

interface StreamingMessageProps {
  message: Message
  onWordsUpdate: (messageId: string, words: Word[]) => void
  onComplete: () => void
  isExpanded: boolean
  toggleExpand: () => void
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  message,
  onWordsUpdate,
  onComplete,
  isExpanded,
  toggleExpand
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [streamedWords, setStreamedWords] = useState<Word[]>([])
  const [hasStartedProcessing, setHasStartedProcessing] = useState(false)

  const startWordProcessing = useCallback(async () => {
    if (hasStartedProcessing || isLoading) return // Prevent multiple calls

    setHasStartedProcessing(true)
    setIsLoading(true)

    try {
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: message.id,
          translationLanguage: 'Russian'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        throw new Error(`Failed to process words: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete chunks
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              // Parse the streamed JSON object
              const parsed = JSON.parse(line)
              if (parsed.words) {
                // Complete response with all words
                const transformedWords = parsed.words.map((word: { word: string; meaning: string; translation: string; languageCode: string }) => ({
                  word: word.word,
                  meaning: word.meaning,
                  translation: word.translation || '',
                  languageCode: word.languageCode
                }))
                setStreamedWords(transformedWords)
                onWordsUpdate(message.id, transformedWords)
                break
              }
            } catch {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing words:', error)
      setHasStartedProcessing(false) // Allow retry on error
    } finally {
      setIsLoading(false)
      onComplete()
    }
  }, [message.id, onWordsUpdate, onComplete, hasStartedProcessing, isLoading])

  useEffect(() => {
    if (message.words.length === 0 && !hasStartedProcessing && !isLoading) {
      // Start word processing when message has no words and hasn't started yet
      startWordProcessing()
    }
  }, [message.words.length, hasStartedProcessing, isLoading, startWordProcessing])

  const displayWords = streamedWords.length > 0 ? streamedWords : message.words

  return (
    <React.Fragment>
      <div className="flex items-start gap-2 w-full">
        <div className="w-full rounded-lg bg-zinc-200 dark:bg-zinc-700 p-2 text-left">
          <MessageText
            text={message.text}
            highlightWords={displayWords}
            isExpanded={isExpanded}
            toggleExpand={toggleExpand}
          />
          {isLoading && (
            <div className="mt-2 text-xs text-gray-500">
              Finding complex words...
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center w-full">
        {displayWords.map((word: Word, wordIndex: number) => (
          <WordCard word={word} key={wordIndex} />
        ))}
      </div>
    </React.Fragment>
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