import { Link } from "react-router-dom"
import React from "react"

type AppShellProps = {
  children: React.ReactNode
}
export const AppShell: React.FC<AppShellProps> = ({ children }) => (
  <div className="flex flex-col min-h-[100dvh]">
    <header className="px-4 lg:px-6 h-14 flex items-center">
      <Link className="flex items-center justify-center" to={"/"}>
        <span className="font-semibold">Learnbefore</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Link
          className="text-sm font-medium hover:underline underline-offset-4"
          to={"/"}
        >
          Profile
        </Link>
      </nav>
    </header>
    {children}
  </div>
)
