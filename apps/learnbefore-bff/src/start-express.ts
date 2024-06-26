import express, { Express, NextFunction, Request, Response } from "express"
import cors from "cors"
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node"

export function startExpress(
  port: number = 3000,
  origin: string = "*",
  authorizedParties: string[] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://learnbefore.com",
  ],
): Express {
  const server: Express = express()

  server.use(express.json({ limit: "1mb" }))
  server.use(express.urlencoded({ limit: "1mb", extended: true }))
  server.use(cors({ origin }))

  server.use(ClerkExpressRequireAuth({ authorizedParties }))

  server.use(
    (
      err: { stack: unknown },
      req: Request,
      res: Response,
      // eslint-disable-next-line no-unused-vars
      next: NextFunction,
    ) => {
      console.error(err.stack)
      res.status(500).send("Unexpected server error")
    },
  )

  server.listen(port, () => console.log(`Server ready on port ${port}.`))

  return server
}
