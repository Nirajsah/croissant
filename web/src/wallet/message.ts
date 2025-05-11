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

export type MutationApplicationRequest = {
  target: string
  type: 'MUTATION'
  applicationId: string
  mutation: string
}

export * as guards from './message.guard'
