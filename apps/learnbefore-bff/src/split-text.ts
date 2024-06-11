export function splitText(text: string, chunkSize: number = 3000): string[] {
  const sentences = text.match(/[^.!?]+[^.!?]+/g) || []
  const chunks: string[] = []

  let currentChunk = ""

  function add(chunk: string) {
    if (chunk.length > 0) chunks.push(chunk)
  }

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += sentence
    } else {
      add(currentChunk)
      currentChunk = sentence
    }
  }

  add(currentChunk)

  return chunks
}
