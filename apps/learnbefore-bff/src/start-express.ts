import express, { Express } from "express"
import bodyParser from "body-parser"

import cors from "cors"

export function startExpress(port: number, origin: string = "*"): Express {
  const server: Express = express()

  server.use(express.json())
  server.use(cors({ origin }))
  server.use(bodyParser.json({ limit: "200kb" }))
  server.listen(port, () => console.log(`Server ready on port ${port}.`))
  return server
}
