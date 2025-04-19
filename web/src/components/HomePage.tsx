import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Copy, MoreVertical } from 'lucide-react'
import { useWallet } from '../store/WalletProvider'

const accounts = [
  { name: 'Account 1', address: '0xaji39u3jago3ijagkh32kj3n1230d' },
  { name: 'Account 2', address: '0x89fj3jf30jfj38fjajf3jfj93jf0' },
  { name: 'Account 3', address: '0x120ab93f8381f88aa01f01ff1cc9' },
]

const TopBar = () => {
  return (
    <div className="relative flex items-center justify-between px-4 w-full min-h-[65px] shadow-sm">
      <div className="font-medium">Net</div>
      <div>Croissant</div>
      <div className="font-medium flex items-center gap-5">
        <MoreVertical className="w-5 h-5 cursor-pointer" />
      </div>
    </div>
  )
}

export const WalletFunctionButtons = () => {
  return (
    <div className="w-full h-[80px] rounded-xl p-4 flex items-center justify-between">
      {/* Send/Transfer Button */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-10 h-10 bg-lime-700/20 rounded-full flex items-center justify-center mb-1">
          <svg
            className="w-5 h-5 text-white"
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
        <span className="text-xs text-white">Send</span>
      </div>

      {/* Receive Button */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-10 h-10 bg-lime-700/20 rounded-full flex items-center justify-center mb-1">
          <svg
            className="w-5 h-5 text-white"
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
        <span className="text-xs text-white">Receive</span>
      </div>

      {/* Swap Button */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-10 h-10 bg-lime-700/20 rounded-full flex items-center justify-center mb-1">
          <svg
            className="w-5 h-5 text-white"
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
        <span className="text-xs text-white">Swap</span>
      </div>

      {/* Buy Button */}
      <div className="flex flex-col items-center justify-center">
        <div className="w-10 h-10 bg-lime-700/20 rounded-full flex items-center justify-center mb-1">
          <svg
            className="w-5 h-5 text-white"
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
        <span className="text-xs text-white">Buy</span>
      </div>

      {/* More/Settings Button */}
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 bg-lime-700/20 rounded-full flex items-center justify-center mb-1">
            <svg
              className="w-5 h-5 text-white"
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
          <span className="text-xs text-white">Sell</span>
        </div>
      </div>
    </div>
  )
}

export const TaskCard = () => {
  const handleCopy = (str: string) => {
    navigator.clipboard.writeText(str)
  }
  return (
    <div className="flex gap-3 flex-col justify-start items-center px-3 h-full">
      <div className="w-full h-full flex max-w-md mt-1 overflow-hidden">
        {/* Card with dark blue gradient background */}
        <div className="flex items-start h-full overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar gap-3">
          {[1, 2, 3].map((_, i, arr) => (
            <div
              key={i}
              className="relative flex-shrink-0 w-[90%] h-full border border-lime-800/50 p-3 rounded-xl overflow-hidden snap-center"
            >
              {/* Light effects */}
              <div className="absolute -top-10 -left-10 w-60 h-40 bg-lime-700/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="absolute -top-5 -left-5 w-20 h-20 bg-lime-100/10 rounded-full blur-lg pointer-events-none"></div>
              <div className="absolute -top-16 -right-16 w-80 h-80 bg-lime-400/10 rounded-full blur-3xl pointer-events-none mix-blend-screen"></div>

              {/* Card Content */}
              <div className="relative h-full flex justify-between flex-col">
                <div className="flex h-[80px] items-center w-full justify-between">
                  <h2 className="text-[45px] font-bold text-gray-200">$0.00</h2>
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
                        fill="#a3e635"
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
                    {/* <span className="text-xs text-white">Chain:</span> */}
                    <span className="truncate py-0.5 text-xs bg-lime-950/20 dark:bg-lime-400/10 text-lime-700 dark:text-lime-400 rounded-full px-1.5">
                      aee928d4bf3880353b4a3cd9b6f88e6cc6e5ed050860abae439e7782e9b2dfe8
                    </span>
                    <button
                      onClick={() => handleCopy('ahiogeagaego3oaga')} // change with the actual address
                      className="hover:text-[#a3e635] transition p-1 rounded-full"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    {/* <span className="text-xs text-white">Owner:</span> */}
                    <span className="truncate py-0.5 text-xs bg-lime-950/20 dark:bg-lime-400/10 text-lime-700 dark:text-lime-400 rounded-full px-1.5">
                      aee928d4bf3880353b4a3cd9b6f88e6cc6e5ed050860abae439e7782e9b2dfe8
                    </span>
                    <button
                      onClick={() => handleCopy('aieoiajgioajgaoigja')}
                      className="hover:text-[#a3e635] transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
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

export const MainContent = () => {
  return (
    <div className="w-full min-h-[40%] p-3">
      <div className="flex h-full gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar">
        {[1, 2].map((_, index) => (
          <div
            key={index}
            className="bg-blue-500/20 rounded-xl h-full flex-shrink-0 snap-center p-3 min-w-[92%]"
          >
            <div className="flex flex-col -space-y-1 w-full h-full">
              <span className="text-xs">My Balance</span>
              <span className="text-[40px] font-bold h-fit w-fit">$0.00</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const Options = () => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="w-full h-[80px] px-2 py-2 rounded-xl bg-lime-500/10 border border-lime-500 flex items-center justify-between">
        <span className="text-xs text-lime-500">Option 1</span>
        <span className="text-xs text-white">Option 1 content</span>
      </div>
      <div className="w-full h-[80px] px-2 py-2 rounded-xl bg-lime-500/10 border border-lime-500 flex items-center justify-between">
        <span className="text-xs text-lime-500">Option 2</span>
        <span className="text-xs text-white">Option 2 content</span>
      </div>
    </div>
  )
}

export const Menu = () => {
  const tabs = ['Tokens', 'Applications', 'Activity']
  const [activeTab, setActiveTab] = useState('Tokens')
  const [highlightStyle, setHighlightStyle] = useState({})
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const activeIndex = tabs.indexOf(activeTab)
    const tabElements = container.querySelectorAll('span')

    if (tabElements.length && tabElements[activeIndex]) {
      const el = tabElements[activeIndex] as HTMLElement
      setHighlightStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      })
    }
  }, [activeTab])

  return (
    <div className="flex flex-col w-full h-full">
      <div
        className="relative flex text-sm py-2 h-fit items-center justify-around"
        ref={containerRef}
      >
        {/* animated background highlight */}
        <div
          className="absolute top-2 bottom-2 bg-lime-500/15 group-data-hover:bg-lime-500/25 dark:group-data-hover:bg-lime-500/20 rounded-full transition-all duration-300"
          style={{ ...highlightStyle }}
        />

        {tabs.map((tab) => (
          <span
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative z-10 px-6 py-1 cursor-pointer inline-flex items-center gap-x-1.5 rounded-full text-sm/5 font-medium sm:text-xs/5
            ${
              tab === activeTab
                ? 'text-lime-700 dark:text-lime-400'
                : 'text-gray-500 dark:text-gray-300'
            }
            `}
          >
            {tab}
          </span>
        ))}
      </div>

      <div key={activeTab} className="px-3 h-full flex-1 animate-fade-slide">
        {activeTab === 'Tokens' && (
          <div className="p-2">
            {/* Crypto Token List */}
            <div className="flex flex-col gap-3">
              {/* Bitcoin Token */}
              <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg hover:bg-black/30 transition cursor-pointer">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-white"
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
                    <div className="font-medium text-white">Bitcoin</div>
                    <div className="text-xs text-gray-300">BTC</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">0.0042 BTC</div>
                  <div className="text-xs text-green-400">$175.32</div>
                </div>
              </div>

              {/* Ethereum Token */}
              <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg hover:bg-black/30 transition cursor-pointer">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-white"
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
                    <div className="font-medium text-white">Ethereum</div>
                    <div className="text-xs text-gray-300">ETH</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">0.158 ETH</div>
                  <div className="text-xs text-green-400">$287.41</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'Applications' && (
          <div className="font-thin">Applications content</div>
        )}
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

type ChainInfo = {
  chainId: string
  publicKey: string
  nextBlockHeight: number
  blockHash?: string | null
}

type ChainInfoListProps = {
  chains: ChainInfo[]
}

const chains = [
  {
    chainId: 'aee928d4bf3880353b4a3cd9b6f88e6cc6e5ed050860abae439e7782e9b2dfe8',
    publicKey:
      '0094970bf1aa9a35bb8c853d5e51fa955ae91abaadb907886173a16b37c928f9ee',
    blockHash:
      '22a370bf1aa9a35bb8c853d5e51fa955ae91abaadb907886173a16b37c928f9ee',
    nextBlockHeight: 0,
  },
  {
    chainId: 'b0128d4bf312123abc3cd9b6fabc86cc123ed050860abae439e7782e9b2dfe8',
    publicKey:
      '22a370bf1aa9a35bb8c853d5e51fa955ae91abaadb907886173a16b37c928f9ee',
    blockHash:
      '22a370bf1aa9a35bb8c853d5e51fa955ae91abaadb907886173a16b37c928f9ee',
    nextBlockHeight: 5,
  },
]

const shortenMiddle = (str: string) => {
  return `${str.slice(0, 10)}...${str.slice(-10)}`
}

export const ChainInfoList = ({ chains }: ChainInfoListProps) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {chains.map((chain, i) => (
        <div
          key={i}
          className="w-full flex-col h-[80px] px-2 py-2 rounded-xl bg-lime-500/10 flex items-center justify-between"
        >
          <div className="flex w-full h-full flex-col">
            <div className="flex gap-1 w-full justify-start">
              <span className="text-xs text-lime-500 text-nowrap">
                Chain ID:
              </span>
              <span className="text-xs text-white truncate">
                {chain.chainId}
              </span>
            </div>

            <div className="flex gap-1 w-full justify-start">
              <span className="text-xs text-lime-500 text-nowrap">
                Public Key:
              </span>
              <span className="text-xs text-white truncate">
                {chain.publicKey}
              </span>
            </div>
            <div className="flex gap-1 w-full justify-start">
              <span className="text-xs text-lime-500 text-nowrap">hash:</span>
              <span className="text-xs text-white truncate">
                {chain.blockHash}
              </span>
            </div>
            <div className="flex gap-1 w-full justify-start">
              <span className="text-xs text-lime-500 text-nowrap">
                Block Height:
              </span>
              <span className="text-xs text-white truncate">
                {chain.nextBlockHeight}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const Footer = () => {
  return (
    <div className="w-full h-[50px] flex justify-center items-center">
      <p className="text-sm text-slate-500">Powered by Croissant</p>
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
          stroke="#fff"
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

export default function HomePage() {
  const { wallet, fetchWallet } = useWallet()
  const [loading, setLoading] = useState(true)

  // useEffect(() => {
  //   let interval: NodeJS.Timeout | null = null
  //   let attempts = 0
  //   const maxRetries = 3

  //   const tryFetch = async () => {
  //     await fetchWallet()
  //     attempts += 1

  //     // If wallet is fetched or we've tried enough, stop polling
  //     if (wallet || attempts >= maxRetries) {
  //       if (interval) clearInterval(interval)
  //       setLoading(false)
  //     }
  //   }

  //   // Call once immediately
  //   tryFetch()

  //   // Start polling every 3 seconds
  //   interval = setInterval(tryFetch, 3000)

  //   // Cleanup on unmount
  //   return () => {
  //     if (interval) clearInterval(interval)
  //   }
  // }, [wallet])

  return (
    <>
      {loading === true ? (
        <Loading />
      ) : (
        <div className="w-full h-full flex flex-col">
          <TopBar />
          <TaskCard />
          <Menu />
        </div>
      )}
    </>
  )
}
