import React from 'react'
import { RefreshCw } from 'lucide-react'

export const WalletCard = ({ walletChain }: { walletChain: any[] }) => {
  const chains = Array.isArray(walletChain) ? walletChain : [walletChain]

  return (
    <div className="w-full h-[220px]">
      <div className="flex h-full overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar gap-2 p-2">
        {chains.map((chain, i) => (
          <div
            key={i}
            className="relative snap-center min-w-[95%] max-w-[500px] h-full text-white overflow-hidden"
          >
            <svg
              viewBox="0 0 335 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute top-0 left-0 w-full h-full z-0"
            >
              <path
                d="M199 0C221.141 1.57401 219.108 34.6909 238.5 36.5H278.5C316.891 36.9922 328.634 33.4528 334.715 58.6191L335 59.8398V177C335 189.703 324.671 200 311.931 200H23.0693C10.3288 200 0 189.703 0 177V23C1.03397e-06 10.2975 10.3288 0 23.0693 0H199Z"
                fill="#191e1c"
              />
            </svg>
            <div className="absolute w-full min-h-[200px] text-white p-6">
              <div className="inset-0 flex flex-col justify-between z-10 text-white">
                <div>
                  <div className="text-xs text-rose-300">Linera</div>
                  <div className="text-[40px] font-bold">$10.00</div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="truncate bg-rose-950/30 px-2 py-1 rounded-full">
                    ChainId: {chain.chain_id}
                  </span>
                  <span className="truncate bg-rose-950/30 px-2 py-1 rounded-full">
                    Account: {chain.key_pair.Ed25519}
                  </span>
                </div>
              </div>
              <button className="text-black text-xs absolute top-0.5 right-2.5 border px-3 py-0.5 rounded-3xl flex justify-center items-center gap-1 bg-white/90 z-20">
                <RefreshCw width={15} />
                sync now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
