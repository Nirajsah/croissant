import React, { useEffect, useRef, useState } from 'react'
import {
  Settings,
  X,
  Info,
  LogOut,
  Network,
  Download,
  Link,
} from 'lucide-react'
import NavBar from './NavBar'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../store/WalletProvider'
import BottomDrawer from './BottomDrawer'

type ChainDropdownProps = {
  selectedChain: string
  options: string[]
  onChange: (chain: string) => void
}

function ChainDropdown({
  selectedChain,
  options,
  onChange,
}: ChainDropdownProps) {
  return (
    <select
      className="bg-transparent text-sm text-white border border-[#ffffff24] px-2 py-1 rounded outline-none"
      value={selectedChain}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((chain) => (
        <option key={chain} value={chain} className="bg-black text-white">
          {chain.slice(0, 6)}...{chain.slice(-4)}
        </option>
      ))}
    </select>
  )
}

export default function SettingsPage() {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const highlightRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [showSettingOption, setShowSettingOption] = useState('option')
  const navigate = useNavigate()
  const { drawerOpen, setDrawerOpen } = useWallet()

  const options = [
    {
      name: 'Default Chain',
      icon: <Link />,
      desc: '',
      dropdown: {
        selectedChain: '0xaih329jxjaji3oau3urjafj3oiur3ua39uaaa3oau38',
        options: [
          '0xaih329jxjaji3oau3urjafj3oiur3ua39uaaa3oau38',
          '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
          '0xcafebabecafebabecafebabecafebabecafebabe',
        ],
      },
    },
    {
      name: 'Download Wallet',
      icon: <Download />,
      desc: 'wallet.json',
      dropdown: '',
    },
    {
      name: 'Network',
      icon: <Network />,
      desc: 'linera.testnet',
      dropdown: '',
    },
    { name: 'LogOut', icon: <LogOut />, desc: '', dropdown: '' },
    { name: 'Info', icon: <Info />, desc: 'v0.1.0', dropdown: '' },
  ]

  function handleMenuChange(name: string) {
    if (name === 'info') {
      setShowSettingOption('info')
    } else if (name === 'download wallet') {
      console.log('wallet download')
    } else {
      setShowSettingOption('option')
    }
  }

  useEffect(() => {
    if (
      hoverIndex !== null &&
      itemRefs.current[hoverIndex] &&
      highlightRef.current
    ) {
      const el = itemRefs.current[hoverIndex]
      highlightRef.current.style.top = `${el?.offsetTop}px`
    }
  }, [hoverIndex])

  return (
    <>
      <NavBar />
      {drawerOpen && <BottomDrawer />}
      <div className="relative w-full overflow-y-auto scroll-smooth flex flex-col h-full max-w-xl mx-auto p-2 gap-3 text-white">
        <div className="text-xl justify-between font-semibold p-2 my-1 flex items-center gap-2">
          <div
            onClick={() => setShowSettingOption('option')}
            className="flex gap-2 items-center cursor-pointer"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </div>
          <X
            onClick={() => navigate('/')}
            className="w-9 h-9 cursor-pointer hover:text-lime-400 p-2 rounded-full"
          />
        </div>

        {/* Shared highlight */}
        {showSettingOption === 'option' && (
          <div>
            <div
              ref={highlightRef}
              className="absolute w-full h-[60px] bg-lime-600/10 transition-all duration-200 ease-in-out pointer-events-none rounded-md"
            />
            {/* Options */}
            {options.map((option, index) => (
              <Option
                key={index}
                name={option.name}
                index={index}
                onHover={setHoverIndex}
                itemRef={(el) => (itemRefs.current[index] = el)}
                icon={option.icon}
                desc={option.desc}
                onClick={handleMenuChange}
                dropdown={option.dropdown}
                setDrawerOpen={setDrawerOpen}
              />
            ))}
          </div>
        )}

        {showSettingOption === 'info' && <InfoSection />}
      </div>
    </>
  )
}

type OptionProps = {
  name: string
  index: number
  onHover: (index: number | null) => void
  itemRef: (el: HTMLDivElement | null) => void
  icon: any
  desc: string
  onClick: any
  dropdown: any
  setDrawerOpen: (state: boolean) => void
}

function Option({
  name,
  index,
  onHover,
  itemRef,
  icon,
  desc,
  onClick,
  dropdown,
  setDrawerOpen,
}: OptionProps) {
  const [selectedChain, setSelectedChain] = useState(
    dropdown?.selectedChain ?? ''
  )

  function handleChainChange(val: any) {
    setDrawerOpen(true)
    setSelectedChain(val)
  }

  return (
    <div
      ref={itemRef}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(name.toLocaleLowerCase())}
      className="w-full text-md h-[60px] flex items-center p-2 cursor-pointer text-gray-300 hover:text-lime-400 transition relative z-10"
    >
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span>{name}</span>
        </div>

        {dropdown ? (
          <ChainDropdown
            selectedChain={selectedChain}
            options={dropdown.options}
            onChange={(val) => handleChainChange(val)}
          />
        ) : (
          <span>{desc}</span>
        )}
      </div>
    </div>
  )
}

function InfoSection() {
  return <div>Info</div>
}
