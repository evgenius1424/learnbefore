import Tesseract from "tesseract.js"
import { readFileAsString } from "./read-file-as-string.ts"

export async function getTextFromFile(file: File): Promise<string> {
  if (file.type === "image/jpeg") {
    try {
      const result = await Tesseract.recognize(file, "eng")
      return result.data.text
    } catch (error) {
      console.error("Error in Tesseract recognition:", error)
      throw error
    }
  } else if (file.type === "text/plain") {
    return readFileAsString(file)
  } else {
    throw new Error("Unsupported file type")
  }
}
