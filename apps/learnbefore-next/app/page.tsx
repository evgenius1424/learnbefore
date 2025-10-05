"use client"
import React from "react"
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs"
import { ChatPage } from "../src/components/chat-page"
import "../src/i18n"

export default function Page() {
  return (
    <>
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <SignIn />
        </div>
      </SignedOut>
      <SignedIn>
        <ChatPage />
      </SignedIn>
    </>
  )
}
