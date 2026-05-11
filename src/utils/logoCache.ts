let cached: string | null = null

export async function getLogoFlujosysBase64(): Promise<string> {
  if (cached) return cached
  const resp = await fetch('/logoflujosys.jpeg')
  const blob = await resp.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      cached = reader.result as string
      resolve(cached)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
