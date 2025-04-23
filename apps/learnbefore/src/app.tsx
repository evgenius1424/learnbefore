import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react"
import { ChatPage } from "./pages/chat-page.tsx"
import React from "react"
import "@repo/ui/styles/globals.css"

const App: React.FC = () => {
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

export default App
