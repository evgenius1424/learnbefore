import { waitFor } from "./waitFor"

export async function* retryableGenerator<T>(
  generatorFunc: () => AsyncGenerator<T>,
  maxRetries = 3,
  delay = 200,
): AsyncGenerator<T> {
  let retryCount = 0
  let emitted = false

  do {
    for await (const item of generatorFunc()) {
      emitted = true
      yield item
    }
    if (emitted) {
      return
    }
    retryCount++
    if (retryCount < maxRetries) {
      await waitFor(delay)
    }
  } while (retryCount < maxRetries)
}
