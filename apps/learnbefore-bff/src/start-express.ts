import express, { Express, NextFunction, Request, Response } from "express"
import cors from "cors"
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"

export function startExpress(
  port: number,
  origin: string = "*",
  authorizedParties: string[] = [
    "http://localhost:3000",
    "https://learnbefore.com",
  ],
): Express {
  const server: Express = express()

  server.use(express.json({ limit: "1mb" }))
  server.use(express.urlencoded({ limit: "1mb", extended: true }))
  server.use(cors({ origin }))

  server.use((err: { stack: unknown }, req: Request, res: Response) => {
    console.error(err.stack)
    res.status(500).send("Unexpected server error")
  })

  server.use(ClerkExpressRequireAuth({ authorizedParties }))

  server.listen(port, () => console.log(`Server ready on port ${port}.`))

  return server
}
