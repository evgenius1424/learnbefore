import React, { ChangeEvent, useCallback, useRef, useState } from "react"
import { getTextFromFile } from "./get-text-from-file.ts"

export function useTextFileUpload(onUpload: (text: string) => void) {
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
      onUpload(text)
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
