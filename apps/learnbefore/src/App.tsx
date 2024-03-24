import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatPage } from "./pages/chat-page";
import { RoutePaths } from "../routes.ts";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path={RoutePaths.index} element={<ChatPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
