import React, { createContext, useState, ReactNode, useContext } from 'react'
import { walletApi } from '../wallet/walletApi'

export const WalletContext = createContext<any | null>(null)

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState(null)

  async function fetchWallet() {
    const walletJson = await walletApi.getWallet()
    if (walletJson) {
      setWallet(JSON.parse(walletJson))
    }
  }

  async function fromJson(wallet_json: string) {
    walletApi
      .setWallet(wallet_json)
      .then(() => {
        setWallet(JSON.parse(wallet_json))
      })
      .catch(() => {
        console.error('Failed to set wallet')
      })
  }

  const values = {
    wallet,
    setWallet: fromJson,
    fetchWallet,
  }

  return (
    <WalletContext.Provider value={values}>{children}</WalletContext.Provider>
  )
}

export const useWallet = () => {
  const walletContext = useContext(WalletContext)
  if (!walletContext) {
    return {}
  }
  return walletContext
}
