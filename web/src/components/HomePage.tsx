import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Copy, MoreVertical } from 'lucide-react'

const accounts = [
  { name: 'Account 1', address: '0xaji39u3jago3ijagkh32kj3n1230d' },
  { name: 'Account 2', address: '0x89fj3jf30jfj38fjajf3jfj93jf0' },
  { name: 'Account 3', address: '0x120ab93f8381f88aa01f01ff1cc9' },
]

const TopBar = () => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [open, setOpen] = useState(false)

  const selected = accounts[selectedIndex]
  const shortAddress = `${selected.address.slice(
    0,
    14
  )}...${selected.address.slice(-4)}`

  const handleCopy = () => {
    navigator.clipboard.writeText(selected.address)
  }

  return (
    <div className="relative flex items-center justify-between px-4 w-full min-h-[65px] shadow-sm">
      <div className="font-medium">Net</div>

      <div className="flex flex-col justify-center min-w-[50%] items-center relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full justify-center items-center gap-1 text-md font-semibold bg-transparent focus:outline-none"
        >
          {selected.name}
          <ChevronDown className="w-4 mt-0.5 flex h-4" />
        </button>

        {open && (
          <div className="absolute top-10 z-10 w-[300px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md shadow-md">
            {accounts.map((acc, idx) => (
              <button
                key={acc.address}
                onClick={() => {
                  setSelectedIndex(idx)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-2 hover:bg-purple-100 dark:hover:bg-purple-400/10 ${
                  selectedIndex === idx
                    ? 'bg-purple-100 dark:bg-purple-400/20'
                    : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span>{acc.name}</span>
                    <span className="text-xs text-gray-300">{acc.address}</span>
                  </div>

                  <span>$0.00</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div
          onClick={handleCopy}
          className="flex w-fit cursor-pointer justify-center items-center gap-1 mt-1 px-2 rounded-full py-0.5 text-xs bg-purple-100 dark:bg-purple-400/10 text-purple-700 dark:text-purple-400"
        >
          <span>{shortAddress}</span>
          <button
            onClick={handleCopy}
            className="hover:text-purple-300 transition"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="font-medium flex items-center gap-5">
        <MoreVertical className="w-5 h-5 cursor-pointer" />
      </div>
    </div>
  )
}

export const MainContent = () => {
  return (
    <div className="w-full min-h-[40%] p-4 flex flex-col justify-between">
      <div className="flex justify-center items-center">
        <h2 className="text-[52px] font-bold">$0.00</h2>
      </div>
    </div>
  )
}

export const Menu = () => {
  const tabs = ['Chains', 'Tokens', 'Applications']
  const [activeTab, setActiveTab] = useState('Chains')
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
          className="absolute top-2 bottom-2 bg-purple-500/15 group-data-hover:bg-purple-500/25 dark:group-data-hover:bg-purple-500/20 rounded-full transition-all duration-300"
          style={{ ...highlightStyle }}
        />

        {tabs.map((tab) => (
          <span
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative z-10 px-6 py-1 cursor-pointer inline-flex items-center gap-x-1.5 rounded-full text-sm/5 font-medium sm:text-xs/5
            ${
              tab === activeTab
                ? 'text-purple-700 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-300'
            }
            `}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="p-4 h-full flex-1">
        {activeTab === 'Chains' && <div>Chains content</div>}
        {activeTab === 'Tokens' && <div>Tokens content</div>}
        {activeTab === 'Applications' && <div>Applications content</div>}
      </div>
    </div>
  )
}

export const Footer = () => {
  return (
    <div className="w-full h-[50px] flex justify-center items-center">
      <p className="text-sm text-slate-500">Powered by Croissant</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="w-full h-full flex flex-col">
      <TopBar />
      <MainContent />
      <Menu />
      <Footer />
    </div>
  )
}
