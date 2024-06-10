import express, { Express, NextFunction, Request, Response } from "express"
import cors from "cors"

export function startExpress(port: number, origin: string = "*"): Express {
  const server: Express = express()

  server.use(express.json({ limit: "1mb" }))
  server.use(express.urlencoded({ limit: "1mb", extended: true }))
  server.use(cors({ origin }))

  server.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack)
    res.status(500).send("Unexpected server error")
  })

  server.listen(port, () => console.log(`Server ready on port ${port}.`))

  return server
}
