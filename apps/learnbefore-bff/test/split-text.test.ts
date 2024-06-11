import { expect, test } from "vitest"
import { splitText } from "../src/split-text"

test("splitText", () => {
  const text =
    "This is sentence one. This is sentence two. This is sentence three."
  const result = splitText(text, 25)

  expect(result).toHaveLength(3)
})
