export type GetWalletRequest = {
  target: string
  type: 'GET_WALLET'
}

export type SetWalletRequest = {
  target: string
  type: 'SET_WALLET'
  wallet: string
}

export type CreateWalletRequest = {
  target: string
  type: 'CREATE_WALLET'
}

export type CreateChainRequest = {
  target: string
  type: 'CREATE_CHAIN'
}

export type QueryApplicationRequest = {
  target: string
  type: 'QUERY'
  applicationId: string
  query: string
}

export type AssignRequest = {
  target: string
  type: 'ASSIGNMENT'
  chainId: string
  timestamp: number
}

export type TransactionConfirmationRequest = {
  target: string
  type: 'TRANSACTION_CONFIRMATION'
  requestId: string
  transactionData: {
    from: string
    to: string
    amount: string
    type: string
    applicationId: string
    mutation?: string
    query?: string
  }
}

export * as guards from './message.guard'
