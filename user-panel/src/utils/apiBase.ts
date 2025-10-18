export const getApiBase = () => {
  const proto = window.location.protocol
  const host = window.location.hostname
  const port = (import.meta as any).env?.VITE_API_PORT || '4000'
  return (import.meta as any).env?.VITE_API_URL || `${proto}//${host}:${port}`
}
