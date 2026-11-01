export const flatten = (value: string | string[] | undefined): string[] => {
  let initialArray: string[]
  if (typeof value === "string") {
    initialArray = value.split(",")
  } else if (Array.isArray(value)) {
    initialArray = value.filter((item): item is string => typeof item === "string")
  } else {
    initialArray = []
  }

  // 2. Split on commas within each array element, then trim
  const expanded = initialArray.reduce<string[]>((acc, str) => {
    const parts = str.split(",").map((s) => s.trim())
    return acc.concat(parts)
  }, [])

  const filtered = expanded.filter((item) => {
    if (item === "true" || item === "false") return false
    if (!isNaN(Number(item))) return false
    return true
  })
  return Array.from(new Set(filtered));
}