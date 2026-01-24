import { walletApi } from '@/wallet/walletApi'
import { ChainId, Convert, WalletChainList } from '@/walletTypes'
import { create } from 'zustand'

type WalletStore = {
  wallet: WalletChainList | null
  isLoading: boolean
  defaultChain: string | null

  ready: boolean
  notification: any
  walletExists: boolean
  // refetch: boolean when calling assign or setInUse if the response is positive we can refetch data by triggerring this

  importWallet: (content: string) => Promise<void>
  fetchWalletAsync: () => Promise<void>
  getBalanceAsync: (chain?: ChainId) => Promise<string | undefined>
}

export const useWalletStore = create<WalletStore>((set, _get) => ({
  wallet: null,
  isLoading: true,
  defaultChain: null,

  importWallet: async (content: string) => {
    try {
      await walletApi.setWallet(content)
      set({ walletExists: true })
    } catch (error) {
      console.error('Error importing wallet:', error)
      throw error
    }
  },

  ready: false,
  walletExists: false,
  notification: null,

  fetchWalletAsync: async () => {
    try {
      const walletData = await walletApi.getWallet()
      if (!walletData) {
        return Promise.reject('Wallet data is empty')
      }
      const wallet = Convert.chainsAsList(walletData)
      const defaultChain = wallet.default
      set({ wallet, walletExists: true, defaultChain, isLoading: false })
    } catch (error) {
      console.error('Fetch failed:', error)
      set({ isLoading: false })
      throw error
    }
  },

  getBalanceAsync: async (chain?: ChainId): Promise<string | undefined> => {
    try {
      const b = await walletApi.getBalance(chain)
      console.log('Fetched balance:', b)
    } catch (e) {
      return Promise.reject(e)
    }
  },

  //   setDefaultAsync: async (chainId: string): Promise<Result<string>> => {
  //     const { server, ready } = get()
  //     if (!server || !ready)
  //       return { success: false, error: 'Server is not ready..' }
  //     try {
  //       const res = await server.setDefault(chainId)
  //       return res
  //     } catch (e) {
  //       return { success: false, error: 'Failed to set Default chain..' }
  //     }
  //   },

  //   setInUseAsync: async (chainId: string) => {
  //     const { server, chainClients, refetch, abortNotificationHandler } = get()

  //     const chainClient = chainClients.get(chainId as ChainId)
  //     if (!chainClient) {
  //       if (!server) throw new Error('Something is wrong..., Server is missing')
  //       abortNotificationHandler()
  //       const chainClient = await server.initChainClient(chainId as ChainId)
  //       const aborter = chainClient.onNotification((data: any) => {
  //         set((state) => (state.notification = data))
  //       })
  //       set({
  //         activeClient: chainClient,
  //         chainClients: chainClients.set(chainId as ChainId, chainClient),
  //         refetch: !refetch,
  //         notificationHandler: aborter,
  //         activeApplication: null,
  //         activeChain: chainId as ChainId,
  //       })
  //     } else {
  //       abortNotificationHandler()
  //       const aborter = chainClient.onNotification((data: any) => {
  //         set((state) => (state.notification = data))
  //       })
  //       set({
  //         activeClient: chainClient,
  //         refetch: !refetch,
  //         notificationHandler: aborter,
  //         activeApplication: null,
  //         activeChain: chainId as ChainId,
  //       })
  //     }
  //   },
}))
