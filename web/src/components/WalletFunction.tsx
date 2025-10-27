import React from 'react'
import { TransferModal } from './Transfer'

export const WalletFunction = () => {
  const [showTransfer, setShowTransfer] = React.useState(false)

  const handleTransfer = async ({
    chain,
    account,
    chainId,
    toAddress,
    amount,
  }: {
    chain: any
    account: any
    chainId: any
    toAddress: any
    amount: string
  }) => {
    console.log(chain, amount, account, chainId, toAddress)
  }
  return (
    <div className="w-full h-[80px] rounded-xl p-4 flex items-center justify-between text-black">
      {/* Send/Transfer Button */}
      <div className="flex flex-col items-center justify-center cursor-pointer">
        <div className="w-10 h-10 bg-rose-700/20 rounded-full flex items-center justify-center mb-1">
          <svg
            className="w-5 h-5 text-textprimary"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 17L17 7M17 7H10M17 7V14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-xs text-textprimary">Send</span>
      </div>

      <TransferModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        onConfirm={handleTransfer}
      />

      {/* Receive Button */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-10 h-10 bg-rose-700/20 rounded-full flex items-center justify-center mb-1">
          <svg
            className="w-5 h-5 text-textprimary"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17 7L7 17M7 17H14M7 17V10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-xs text-textprimary">Receive</span>
      </div>

      {/* Swap Button */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-10 h-10 bg-rose-700/20 rounded-full flex items-center justify-center mb-1">
          <svg
            className="w-5 h-5 text-textprimary"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 16L17 16M17 16L13 12M17 16L13 20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 8L7 8M7 8L11 4M7 8L11 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-xs text-textprimary">Swap</span>
      </div>

      {/* Buy Button */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-10 h-10 bg-rose-700/20 rounded-full flex items-center justify-center mb-1">
          <svg
            className="w-5 h-5 text-textprimary"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 6V18M12 6L7 11M12 6L17 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-xs text-textprimary">Buy</span>
      </div>

      {/* More/Settings Button */}
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 bg-rose-700/20 rounded-full flex items-center justify-center mb-1">
            <svg
              className="w-5 h-5 text-textprimary"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 18V6M12 18L7 13M12 18L17 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-xs text-textprimary">Sell</span>
        </div>
      </div>
    </div>
  )
}
