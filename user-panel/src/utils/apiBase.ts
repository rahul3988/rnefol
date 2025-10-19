export const getApiBase = () => {
  // Always use the backend server directly for development
  if (import.meta.env.DEV) {
    return 'http://192.168.1.66:4000' // Direct backend URL
  }
  
  // For production, use environment variables or fallback
  const proto = window.location.protocol
  const host = window.location.hostname
  const port = (import.meta as any).env?.VITE_API_PORT || '4000'
  return (import.meta as any).env?.VITE_API_URL || `${proto}//${host}:${port}`
}
