import { Copy, RefreshCw } from 'lucide-react'
import { ChainInfo } from '@/walletTypes'
import React from 'react'
import { walletApi } from '@/wallet/walletApi'

export const WalletCard = ({
  walletChain,
  defaultChain,
  handleSetDefault,
}: {
  walletChain: ChainInfo[]
  defaultChain: string
  handleSetDefault: any
}) => {
  const chains = Array.isArray(walletChain) ? walletChain : [walletChain]
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [balance, setBalance] = React.useState(0)

  React.useEffect(() => {
    let alive = true
    async function fetchBalance() {
      try {
        const bal = await walletApi.getBalances()
        if (alive) setBalance(bal)
      } catch (err) {
        if (alive) setBalance(0)
      }
    }
    fetchBalance()
    return () => {
      alive = false
    }
  }, [])

  // React.useEffect(() => {
  //   const el = scrollRef.current
  //   if (!el) return

  //   const onWheel = (e: WheelEvent) => {
  //     // Let trackpads work naturally
  //     if (Math.abs(e.deltaX) > 0) return

  //     // For vertical mouse wheel, convert to horizontal
  //     e.preventDefault()
  //     el.scrollLeft += e.deltaY
  //   }

  //   el.addEventListener('wheel', onWheel, { passive: false })
  //   return () => el.removeEventListener('wheel', onWheel)
  // }, [])

  React.useEffect(() => {
    const el: any = scrollRef.current
    if (!el) return

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaX) > 0) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel, { passive: false })
    }
  }, [])

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
  }

  return (
    <div className="w-full h-[220px] max-w-[370px]">
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain',
        }}
        className="scroll-container flex h-full overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar gap-2 p-2"
      >
        {chains.map((chain, i) => (
          <div
            key={i}
            className="relative snap-center min-w-[95%] w-full h-full text-white overflow-hidden"
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
            <div className="absolute w-full min-h-[200px] text-white">
              <div className="inset-0 flex flex-col justify-between z-10 text-white">
                <div className="px-6 pt-6">
                  <div className="text-xs text-rose-300">Linera</div>
                  <div className="text-[40px] font-bold">{balance || 0}</div>
                </div>
                <div className="flex w-full mt-4 p-2 flex-col justify-between items-start text-xs">
                  <span className="flex items-center gap-2 px-2 py-1 rounded-full text-sm w-full min-w-0">
                    <span className="truncate">ChainId: {chain.chainId}</span>
                    <Copy
                      size={14}
                      className="cursor-pointer text-gray-500 hover:text-gray-700 flex-shrink-0"
                      onClick={() => handleCopy(chain.chainId)}
                    />
                  </span>
                  <span className="flex items-center gap-2 px-2 py-1 rounded-full text-sm w-full min-w-0">
                    <span className="truncate">Account: {chain.owner}</span>
                    <Copy
                      size={14}
                      className="cursor-pointer text-gray-500 hover:text-gray-700 flex-shrink-0"
                      onClick={() => handleCopy(chain.owner)}
                    />
                  </span>
                </div>
                {defaultChain === chain.chainId ? (
                  <button
                    disabled={true}
                    className="text-white bg-black text-xs absolute top-1 right-4 px-4 py-1 rounded-3xl flex justify-center items-center gap-1 z-20"
                  >
                    <RefreshCw width={15} />
                    Default
                  </button>
                ) : (
                  <button
                    onClick={() => handleSetDefault(chain.chainId)}
                    className="text-black text-xs absolute top-1 right-0 border px-3 py-0.5 rounded-3xl flex justify-center items-center gap-0.5 bg-white/90 z-20"
                  >
                    <RefreshCw width={15} />
                    Set Default
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
