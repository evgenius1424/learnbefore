import express, { Express } from "express"
import cors from "cors"

export function startExpress(
  port: number = 3000,
  origin: string = "*",
): Express {
  const server: Express = express()

  server.use(express.json({ limit: "1mb" }))
  server.use(express.urlencoded({ limit: "1mb", extended: true }))
  server.use(cors({ origin }))

  server.listen(port, () => console.log(`Server ready on port ${port}.`))

  return server
}
