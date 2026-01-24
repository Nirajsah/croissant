import { walletApi } from '@/wallet/walletApi'
import { ArrowRight, ChevronDown, X } from 'lucide-react'
import React, { useState } from 'react'

type TransferModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (payload: {
    chain: any
    account: any
    chainId: any
    toAddress: any
    amount: string
  }) => Promise<void>
}

export function TransferModal({
  open,
  onClose,
  // onConfirm,
}: TransferModalProps) {
  // const [to, setTo] = useState('')
  // const [error, setError] = useState<string | null>(null)
  const [selectedChain, setSelectedChain] = useState<any>(null)
  // const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [chainId, setChainId] = useState<any>('')
  // const [toAddress, setToAddress] = useState<any>('')
  // const [amount, setAmount] = useState<any>('')
  const [showChainDropdown, setShowChainDropdown] = useState<any>(false)
  // const [showAccountDropdown, setShowAccountDropdown] = useState<any>(false)
  const [loading, _setLoading] = useState(false)
  // const [copied, setCopied] = useState(false)

  // Mock data - replace with actual Web3 data
  const chains = [
    {
      id: 1,
      name: 'Ethereum',
      symbol: 'ETH',
      color: 'bg-blue-500',
      balance: '2.5847',
    },
    {
      id: 56,
      name: 'BSC',
      symbol: 'BNB',
      color: 'bg-yellow-500',
      balance: '15.2341',
    },
    {
      id: 137,
      name: 'Polygon',
      symbol: 'MATIC',
      color: 'bg-purple-500',
      balance: '834.12',
    },
    {
      id: 43114,
      name: 'Avalanche',
      symbol: 'AVAX',
      color: 'bg-red-500',
      balance: '45.67',
    },
  ]

  // const accounts = [
  //   {
  //     id: 1,
  //     name: 'Main Wallet',
  //     address: '0x742d35Cc6634C0532925a3b8D2145693f4Ba85D6',
  //     balance: '2.5847',
  //   },
  //   {
  //     id: 2,
  //     name: 'Trading Wallet',
  //     address: '0x8ba1f109551bD432803012645Hac136c82C7322',
  //     balance: '1.2345',
  //   },
  //   {
  //     id: 3,
  //     name: 'Savings Wallet',
  //     address: '0x1234567890abcdef1234567890abcdef12345678',
  //     balance: '8.9012',
  //   },
  // ]

  React.useEffect(() => {
    if (selectedChain) {
      setChainId(selectedChain.id.toString())
    }
  }, [selectedChain])

  // const handleCopyAddress = () => {
  //   if (selectedAccount) {
  //     navigator.clipboard.writeText(selectedAccount.address)
  //     setCopied(true)
  //     setTimeout(() => setCopied(false), 2000)
  //   }
  // }

  const handleTransfer = async () => {
    // setLoading(true)
    // Simulate transfer process
    // setTimeout(() => {
    //   setLoading(false)
    //   onConfirm?.({
    //     chain: selectedChain,
    //     account: selectedAccount,
    //     chainId,
    //     toAddress,
    //     amount,
    //   })
    // }, 2000)
    await walletApi.setDefaultChain(chainId)
  }

  // const isFormValid =
  //   selectedChain && selectedAccount && chainId && toAddress && amount
  if (!open) return null

  return (
    <div className="absolute text-black w-full h-full right-0 top-0 flex items-center justify-center z-50 p-2">
      <div className="bg-white w-full h-full p-3 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Transfer Tokens
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center"
          >
            <X className="w-5 h-5 hover:text-rose-500" />
          </button>
        </div>

        <div className="mt-5 h-full flex flex-col justify-between">
          <div className="gap-3 flex flex-col">
            <div className="">
              <label className="text-sm font-medium">Select Chain</label>
              <div className="relative">
                <button
                  onClick={() => setShowChainDropdown(!showChainDropdown)}
                  className="w-full border px-3 py-2 flex items-center justify-between"
                >
                  {selectedChain ? (
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 ${selectedChain.color} rounded-full flex items-center justify-centertext-sm font-bold`}
                      >
                        {selectedChain.symbol[0]}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">
                          {selectedChain.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedChain.balance} {selectedChain.symbol}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      Choose a chain
                    </span>
                  )}
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${showChainDropdown ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {showChainDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-10 overflow-hidden">
                    {chains.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => {
                          setSelectedChain(chain)
                          setShowChainDropdown(false)
                        }}
                        className="w-full border px-3 py-2 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div
                          className={`w-8 h-8 ${chain.color} rounded-full flex items-center justify-center text-sm font-bold`}
                        >
                          {chain.symbol[0]}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">
                            {chain.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {chain.balance} {chain.symbol}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center w-full h-[100px] text-[60px]">
              0.00
            </div>

            <div className="space-y-5">
              <div className="flex flex-col">
                <label className="text-sm font-medium">ChainId</label>
                <input
                  value={chainId}
                  onChange={(e) => setChainId(e.target.value)}
                  className="border px-2 py-1"
                  placeholder="chainId"
                />
              </div>
              {chainId}

              <div className="flex flex-col">
                <label className="text-sm font-medium">Address</label>
                <input className="border px-2 py-1" placeholder="Address" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
