import { useEffect, useRef } from "react"

export function useScrollToRef(dependency: unknown) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(
    () => ref.current?.scrollIntoView({ behavior: "smooth" }),
    [dependency],
  )

  return ref
}
