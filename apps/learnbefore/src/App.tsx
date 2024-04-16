import { BrowserRouter, Route, Routes } from "react-router-dom"
import { RoutePaths } from "../routes.ts"
import { DebugChatPage } from "./pages/debug-chat-page.tsx"

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path={RoutePaths.index} element={<DebugChatPage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
