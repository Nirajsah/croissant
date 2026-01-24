import React from 'react'
import {
  Settings,
  X,
  Info,
  LogOut,
  Network,
  Download,
  Link,
  ChevronLeft,
} from 'lucide-react'
import NavBar from '../components/NavBar'
import { useNavigate } from 'react-router-dom'

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
      className="bg-transparent text-sm border border-lime-400 px-2 py-1 rounded outline-none"
      value={selectedChain}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((chain) => (
        <option key={chain} value={chain} className="bg-black text-textprimary">
          {chain.slice(0, 6)}...{chain.slice(-4)}
        </option>
      ))}
    </select>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()

  const [showSettingOption, setShowSettingOption] = React.useState('settings')

  const options = [
    {
      name: 'Admin Chain',
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
    if (name === 'info' || name === 'network') {
      setShowSettingOption(name)
    } else if (name === 'download wallet') {
      console.log('wallet download')
    } else {
      setShowSettingOption('settings')
    }
  }

  return (
    <>
      <NavBar />
      <div className="relative text-black w-full overflow-y-auto scroll-smooth flex flex-col h-full max-w-xl p-2 gap-3 text-textprimary">
        <div className="text-xl justify-between font-semibold p-2 my-1 flex items-center gap-2">
          {showSettingOption !== 'settings' && (
            <ChevronLeft
              className="w-6 h-6 cursor-pointer hover:text-rose-400"
              onClick={() => handleMenuChange('settings')}
            />
          )}
          <div className="flex gap-2 items-center">
            {showSettingOption === 'settings' && (
              <Settings className="w-5 h-5" />
            )}
            <span>{showSettingOption.toUpperCase()}</span>
          </div>
          <X
            onClick={() => navigate('/')}
            className="w-9 h-9 cursor-pointer hover:text-rose-400 p-2 rounded-full"
          />
        </div>

        {showSettingOption === 'settings' && (
          <div className="relative flex flex-col justify-center items-center w-full">
            {/* Render options */}
            {options.map((option, index) => (
              <Option
                key={index}
                name={option.name}
                icon={option.icon}
                desc={option.desc}
                onClick={handleMenuChange}
                dropdown={option.dropdown}
              />
            ))}
          </div>
        )}

        {showSettingOption === 'info' && <InfoSection />}
        {showSettingOption === 'network' && <NetworkSection />}
      </div>
    </>
  )
}

type OptionProps = {
  name: string
  icon: any
  desc: string
  onClick: any
  dropdown: any
}

function Option({
  name,
  icon,
  desc,
  onClick,
  dropdown,
}: OptionProps) {
  const [selectedChain, setSelectedChain] = React.useState(
    dropdown?.selectedChain ?? ''
  )

  function handleChainChange(val: any) {
    setSelectedChain(val)
  }

  return (
    <div
      onClick={() => onClick(name.toLocaleLowerCase())}
      className="w-full text-base h-[60px] text-black flex items-center p-2 cursor-pointer hover:text-rose-400"
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
  return (
    <section className="px-1 py-2 max-w-3xl mx-auto text-textprimary">
      <h2 className="text-3xl font-bold mb-4">About Croissant Wallet</h2>
      <p className="text-base leading-relaxed mb-6">
        Croissant Wallet is a lightweight, privacy-conscious crypto wallet built
        for speed and simplicity. Designed for developers and power users, it
        runs directly in your browser and integrates seamlessly with modern Web3
        apps.
      </p>

      <h3 className="text-2xl font-semibold mb-2">Key Features</h3>
      <ul className="list-disc list-inside space-y-2 text-base">
        <li>Secure and persistent key storage</li>
        <li>Fast chain claiming and faucet integration</li>
        <li>WASM-powered performance</li>
        <li>No unnecessary bloat or tracking</li>
      </ul>

      <h3 className="text-2xl font-semibold mt-8 mb-2">How It Works</h3>
      <p className="text-base leading-relaxed">
        Your wallet is generated and encrypted locally. You can interact with
        chains using a minimal interface that keeps you in control. Advanced
        features like custom chain claiming and network switching are available
        for developers.
      </p>
    </section>
  )
}

function NetworkSection() {
  const [networks, setNetworks] = React.useState(['linera.testnet.v2'])
  const [newNetwork, setNewNetwork] = React.useState('')

  function handleAddNetwork() {
    const trimmed = newNetwork.trim()
    if (trimmed && !networks.includes(trimmed)) {
      setNetworks([...networks, trimmed])
      setNewNetwork('')
    }
  }

  return (
    <section className="p-2 text-textprimary">
      <div className="mb-6">
        <p className="text-base mb-2">Current Network:</p>
        <div className="border border-white rounded px-4 py-2">
          {networks[0]}
        </div>
      </div>

      <div>
        <p className="text-base mb-2">Add New Network:</p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="bg-gray-200 border border-white text-black px-3 py-2 w-full"
            placeholder="e.g. linera.devnet.v1"
            value={newNetwork}
            onChange={(e) => setNewNetwork(e.target.value)}
          />
          <button
            className="border border-white px-4 py-2"
            onClick={handleAddNetwork}
          >
            Add
          </button>
        </div>
      </div>

      {networks.length > 1 && (
        <div className="mt-6">
          <p className="text-base mb-2">Available Networks:</p>
          <ul className="list-disc list-inside space-y-1">
            {networks.slice(1).map((net, idx) => (
              <li key={idx}>{net}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
