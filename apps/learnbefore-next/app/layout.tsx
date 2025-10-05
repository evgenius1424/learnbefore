import type { Metadata } from "next"
import {
  ClerkProvider,
} from "@clerk/nextjs"
import { Geist, Geist_Mono } from "next/font/google"
import "@repo/ui/styles/globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Learnbefore - Language Learning Platform",
  description: "Discover unfamiliar words before encountering them in films, books, and blogs.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
