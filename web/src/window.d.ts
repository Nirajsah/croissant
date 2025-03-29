// window.d.ts
export {}

declare global {
  interface Window {
    linera: {
      request: (method: string, params?: any) => Promise<any>
    }
  }
}
