import React, { createContext, useState, ReactNode, useContext } from 'react'
import { walletApi } from '../wallet/walletApi'
import { type Wallet } from '../walletTypes'

interface WalletContextType {
  wallet: Wallet | null
  setWallet: React.Dispatch<React.SetStateAction<Wallet | null>>
  importWallet: (json: string) => Promise<boolean>
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  drawerOpen: boolean
  setDrawerOpen: (state: boolean) => void
}

export const WalletContext = createContext<WalletContextType | null>(null)

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  async function importWallet(wallet_json: string): Promise<boolean> {
    return walletApi
      .setWallet(wallet_json)
      .then(() => {
        setWallet(JSON.parse(wallet_json))
        return true
      })
      .catch(() => {
        console.error('Failed to set wallet')
        return false
      })
  }

  const values: WalletContextType = {
    wallet,
    setWallet,
    importWallet,
    isLoading,
    setIsLoading,
    drawerOpen,
    setDrawerOpen,
  }

  return (
    <WalletContext.Provider value={values}>{children}</WalletContext.Provider>
  )
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('Wallet context is not available')
  }
  return context
}
