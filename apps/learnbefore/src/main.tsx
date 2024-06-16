import ReactDOM from "react-dom/client"
import App from "./app.tsx"
import "./../src/globals.css"
import { ClerkProvider } from "@clerk/clerk-react"
import React from "react"
import "./i18n"

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing clerk publishable key.")
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
    ,
  </React.StrictMode>,
)
