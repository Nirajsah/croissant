// window.d.ts
export { }

declare global {
  interface Window {
    linera: {
      request: (request: LineraWalletRequest) => Promise<LineraWalletResponse>
    }
  }

  type LineraWalletRequest =
    | QueryApplicationRequest
    | AssignmentRequest

  interface LineraWalletResponse {
    id: string
    result?: any
    error?: string
  }
}


interface QueryApplicationRequest {
  type: 'QUERY'
  applicationId: string
  query: string
}

interface AssignmentRequest {
  type: 'ASSIGNMENT'
  chainId: string
  timestamp: string
}

