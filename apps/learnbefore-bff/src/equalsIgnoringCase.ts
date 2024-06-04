function equalsIgnoringCase(text: string, other: string) {
  return text.localeCompare(other, undefined, { sensitivity: "base" }) === 0
}
