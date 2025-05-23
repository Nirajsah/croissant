import React, { useEffect, useRef, useState } from 'react'
import { Copy } from 'lucide-react'
import { useWallet } from '../store/WalletProvider'
import { ChainValue, Convert } from '../walletTypes'
import { useNavigate } from 'react-router-dom'
import { walletApi } from '../wallet/walletApi'
import NavBar from './NavBar'

export const WalletFunctionButtons = () => {
  return (
    <div className="w-full h-[80px] rounded-xl p-4 flex items-center justify-between text-black">
      {/* Send/Transfer Button */}
      <div className="flex flex-col items-center justify-center">
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

export const WalletCard = ({
  walletChain,
}: {
  walletChain: ChainValue[] | any
}) => {
  const handleCopy = (str: string | undefined) => {
    if (!str) return
    navigator.clipboard.writeText(str)
  }
  const chains = Array.isArray(walletChain) ? walletChain : [walletChain]
  console.log('chains in homepage', chains)

  return (
    <div className="flex gap-3 flex-col justify-start items-center px-3 mt-2 h-full text-white">
      <div className="w-full h-full flex max-w-md mt-1 overflow-hidden">
        {/* Card with dark blue gradient background */}
        <div className="relative flex items-start h-full overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar gap-3">
          {chains?.map((chain: any, i: any) => (
            <div className="relative w-full min-w-[93%]">
              <div
                className="absolute w-full bg-gray-800 rounded-2xl h-full transition-all duration-300 ease-in-out"
                style={{
                  left: '5px',
                  top: '5px',
                }}
              />
              <div
                key={i}
                className="relative w-full h-full bg-rose-400 p-3 rounded-2xl overflow-hidden snap-center"
              >
                <div className="relative h-full flex justify-between flex-col">
                  <div className="flex h-[80px] items-center w-full justify-between">
                    <h2 className="text-[45px] font-bold text-white">$0.00</h2>
                    <span>
                      <svg
                        width="45"
                        height="45"
                        viewBox="0 0 409 409"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <mask
                            id="cutout-mask"
                            maskUnits="userSpaceOnUse"
                            x="0"
                            y="0"
                            width="409"
                            height="409"
                          >
                            <rect width="409" height="409" fill="white" />
                            <path
                              d="M145.5 205L174.5 154H233.5L263 205L233.5 255.5H174.5L145.5 205Z"
                              fill="black"
                            />
                            <path
                              d="M146 304L131.5 277L277.5 277.5L261.5 304H146Z"
                              fill="black"
                            />
                            <path
                              d="M262.5 106L277 133L131 132.5L147 106H262.5Z"
                              fill="black"
                            />
                            <path
                              d="M118.24 154L89 205.254L118.744 255H150L121.769 205.254L150 154H118.24Z"
                              fill="black"
                            />
                            <path
                              d="M289.76 256L319 204.239L289.256 154H258L286.231 204.239L258 256H289.76Z"
                              fill="black"
                            />
                            <path
                              d="M100.5 141L87 118L36 204.5L87.5 291.5L100.5 268.5L64.5 204.5L100.5 141Z"
                              fill="black"
                            />
                            <path
                              d="M308 268.5L321.5 291.5L372.5 205L321 118L308 141L344 205L308 268.5Z"
                              fill="black"
                            />
                          </mask>
                        </defs>

                        <circle
                          cx="204.5"
                          cy="204.5"
                          r="204"
                          fill="#be3636"
                          mask="url(#cutout-mask)"
                        />

                        <g fill="none" stroke="black">
                          <path d="M145.5 205L174.5 154H233.5L263 205L233.5 255.5H174.5L145.5 205Z" />
                          <path d="M146 304L131.5 277L277.5 277.5L261.5 304H146Z" />
                          <path d="M262.5 106L277 133L131 132.5L147 106H262.5Z" />
                          <path d="M118.24 154L89 205.254L118.744 255H150L121.769 205.254L150 154H118.24Z" />
                          <path d="M289.76 256L319 204.239L289.256 154H258L286.231 204.239L258 256H289.76Z" />
                          <path d="M100.5 141L87 118L36 204.5L87.5 291.5L100.5 268.5L64.5 204.5L100.5 141Z" />
                          <path d="M308 268.5L321.5 291.5L372.5 205L321 118L308 141L344 205L308 268.5Z" />
                        </g>
                      </svg>
                    </span>
                  </div>
                  <div className="w-full space-y-2">
                    <div className="flex items-center space-x-1">
                      {/* <span className="text-xs text-textprimary">Chain:</span> */}
                      <span className="truncate py-0.5 text-xs bg-rose-950/20 dark:bg-rose-950/20 text-rose-300 dark:text-rose-300 rounded-full px-1.5">
                        {chain.chain_id}
                      </span>
                      <button
                        onClick={() => handleCopy(chain.chain_id)} // change with the actual address
                        className="hover:text-white transition p-1 rounded-full"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-1">
                      {/* <span className="text-xs text-textprimary">Owner:</span> */}
                      <span className="truncate py-0.5 text-xs bg-rose-950/20 dark:bg-rose-950/20 text-rose-300 dark:text-rose-300 rounded-full px-1.5">
                        {chain.key_pair?.Ed25519}
                      </span>
                      <button
                        onClick={() => handleCopy(chain.key_pair?.Ed25519)}
                        className="hover:text-white transition"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WalletFunctionButtons />
    </div>
  )
}

export const Menu = () => {
  const tabs = ['Tokens', 'Applications', 'Activity']
  const [activeTab, setActiveTab] = useState('Tokens')
  const containerRef = useRef<HTMLDivElement>(null)

  const [shadowPosition, setShadowPosition] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<any>({})

  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTab]

    if (activeTabElement) {
      setShadowPosition({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth,
      })
    }
  }, [activeTab])

  return (
    <div className="flex flex-col w-full h-full mt-2">
      <div
        ref={containerRef}
        className="relative flex justify-center items-center gap-4"
      >
        {/* Animated bottom dark layer */}
        <div
          className="absolute bg-gray-800 rounded-full h-10 transition-all duration-300 ease-in-out"
          style={{
            left: `${shadowPosition.left}px`,
            width: `${shadowPosition.width}px`,
            top: '0.5px',
          }}
        />

        {tabs.map((tab) => (
          <div
            key={tab}
            ref={(el) => (tabRefs.current[tab] = el)}
            onClick={() => setActiveTab(tab)}
            className={`relative cursor-pointer px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 inline-flex items-center gap-x-1.5 z-10
              ${
                tab === activeTab
                  ? 'text-red-600 bg-red-50 border border-red-200 transform -translate-y-0.5 -translate-x-0.5'
                  : 'text-gray-500 bg-gray-100 border border-gray-200 hover:bg-gray-200'
              }
            `}
          >
            {tab}
          </div>
        ))}
      </div>

      <div key={activeTab} className="px-3 h-full flex-1 animate-fade-slide">
        {activeTab === 'Tokens' && (
          <div className="p-2">
            {/* Crypto Token List */}
            <div className="flex flex-col gap-3">
              {/* Bitcoin Token */}
              <div className="flex items-center justify-between p-2 rounded-lg transition cursor-pointer">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-textprimary"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 8h6m-6 4h6m-3-8v4m-3 8h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-black">Bitcoin</div>
                    <div className="text-xs text-black">BTC</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-black">0.0042 BTC</div>
                  <div className="text-xs text-green-400">$175.32</div>
                </div>
              </div>

              {/* Ethereum Token */}
              <div className="flex items-center justify-between p-2 rounded-lg transition cursor-pointer">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-textprimary"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2L4 12l8 4m0-14l8 10-8 4m-8-4h16m-8-4v12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-black">Ethereum</div>
                    <div className="text-xs text-black">ETH</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-black">0.158 ETH</div>
                  <div className="text-xs text-green-400">$287.41</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'Applications' && <div>Hello</div>}
        {activeTab === 'Activity' && (
          <div className="w-full flex flex-col gap-2 overflow-hidden h-full">
            <span className="text-xs">Block Height: 10</span>
            <div className="w-full h-0 flex-grow overflow-y-auto overflow-x-hidden">
              {[1, 2, 3, 4, 5, 7, 7, 8, 8, 8, 8, 8, 8, 88, 8, 8].map(
                (hash, idx) => (
                  <div key={idx} className="text-xs px-2 hover:bg-gray-100/10">
                    {hash}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <svg
        width="400"
        height="120"
        viewBox="0 0 400 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Great Vibes', cursive"
          fontSize="60"
          stroke="#000"
          strokeWidth="1"
          fill="transparent"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="1000"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-dasharray"
            values="1000;1000"
            dur="2s"
            repeatCount="indefinite"
          />
          Croissant
        </text>
        <style>
          {`
            text {
              stroke-dasharray: 1000;
              stroke-dashoffset: 1000;
              animation: draw 2s linear infinite;
            }
            @keyframes draw {
              0% {
                stroke-dashoffset: 1000;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }
          `}
        </style>
      </svg>
    </div>
  )
}

export const checkWalletExists = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const request = indexedDB.open('linera_wallet')

    request.onsuccess = () => {
      const db = request.result

      try {
        if (!db.objectStoreNames.contains('wallet')) {
          console.log('Wallet store does not exist.')
          db.close()
          indexedDB.deleteDatabase('linera_wallet')
          resolve(false)
          return
        } else {
          resolve(true)
        }
      } catch (err) {
        console.log('Transaction failed:', err)
        indexedDB.deleteDatabase('linera_wallet')
        resolve(false)
      }
    }

    request.onerror = () => {
      console.error('Failed to open DB')
      indexedDB.deleteDatabase('linera_wallet')
      resolve(false)
    }
  })
}

export default function HomePage() {
  const { wallet, isLoading, setWallet, setIsLoading } = useWallet()
  const navigate = useNavigate()
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    async function wakeUp() {
      await walletApi.ping()
    }
    wakeUp()

    const fetchWallet = async () => {
      const walletExists = await checkWalletExists()
      if (!walletExists) {
        navigate('/set')
        return
      }
      try {
        const walletData = await walletApi.getWallet()
        console.log('wallet data', walletData)
        if (!walletData) {
          navigate('/set')
          return
        }
        setWallet(Convert.toWallet(walletData))
        setIsLoading(false)
      } catch (error) {
        console.error(
          `Error fetching wallet (attempt ${retryCount + 1}/3):`,
          error
        )
        if (retryCount < 2) {
          setRetryCount((prev) => prev + 1)
          timeoutId = setTimeout(fetchWallet, 1000)
        } else {
          navigate('/set')
        }
      }
    }

    timeoutId = setTimeout(fetchWallet, 1000)

    return () => clearTimeout(timeoutId)
  }, [navigate, setWallet, retryCount])

  if (isLoading) {
    return <Loading />
  }

  if (!wallet) {
    setIsLoading(true)
    return
  }

  const { chains } = wallet

  return (
    <div className="w-full h-full flex flex-col relative">
      <NavBar />
      {wallet.chains && <WalletCard walletChain={Object.values(chains)} />}
      <Menu />
    </div>
  )
}
