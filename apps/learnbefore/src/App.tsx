import { BrowserRouter, Route, Routes } from "react-router-dom"
import { RoutePaths } from "../routes.ts"
import { ChatPage } from "./pages/chat-page.tsx"

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path={RoutePaths.index} element={<ChatPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
