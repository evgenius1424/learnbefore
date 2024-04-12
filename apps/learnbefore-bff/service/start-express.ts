import express, { Express } from "express"
import cors from "cors"

export function startExpress(port: number, origin: string = "*"): Express {
  const server: Express = express()

  server.use(express.json())
  server.use(cors({ origin }))
  server.listen(port, () => console.log(`Server ready on port ${port}.`))
  return server
}
