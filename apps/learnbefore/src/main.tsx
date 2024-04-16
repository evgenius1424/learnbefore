import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./../src/globals.css"

const { worker: devServer } = await import("./mocks/browser.ts")

devServer.start().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
