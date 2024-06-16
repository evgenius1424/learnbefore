export async function createMessageFetcher(inputValue: string) {
  return await fetch("/api/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: inputValue }),
  })
}
