import React from 'react'

export const Menu = () => {
  const tabs = ['Tokens', 'Applications', 'Activity']
  const [activeTab, setActiveTab] = React.useState('Tokens')
  const [highlightStyle, setHighlightStyle] = React.useState({})
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
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
          className="absolute top-2 bottom-2 bg-rose-500/15 group-data-hover:bg-rose-500/25 dark:group-data-hover:bg-rose-500/20 rounded-full transition-all duration-300"
          style={{ ...highlightStyle }}
        />

        {tabs.map((tab) => (
          <span
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative z-10 px-6 py-1 cursor-pointer inline-flex items-center gap-x-1.5 rounded-full text-[13px] font-medium
            ${
              tab === activeTab
                ? 'text-rose-700 dark:text-rose-400'
                : 'text-black dark:text-black'
            }
            `}
          >
            {tab}
          </span>
        ))}
      </div>

      <div key={activeTab} className="px-3 h-full flex-1 animate-fade-slide">
        {activeTab === 'Tokens' && (
          <div className="p-2 text-black">
            <div className="flex flex-col gap-3"></div>
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
