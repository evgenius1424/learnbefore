import React from "react"

type AppShellProps = {
  children: React.ReactNode
}
export const AppShell: React.FC<AppShellProps> = ({ children }) => (
  <div className="flex flex-col min-h-[100dvh]">
    <header className="px-4 lg:px-6 h-14 flex items-center">
      <div className="flex items-center justify-center">
        <span className="font-semibold">Learnbefore</span>
      </div>
    </header>
    {children}
  </div>
)
