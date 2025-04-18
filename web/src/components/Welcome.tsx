import React from 'react'
import { walletApi } from '../wallet/walletApi'
import { useNavigate } from 'react-router-dom'

export default function Welcome() {
  const handleWallet = (wallet: string) => {
    console.log('Wallet', wallet)
  }

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const contents = event.target?.result as string
        handleWallet(contents)
      }
      reader.readAsText(file)
    }
  }

  const handleHello = async () => {
    const response = await walletApi.sayHello()
    console.log('Response from background:', response)
  }

  const navigate = useNavigate()

  return (
    <div className="h-full w-full flex flex-col justify-center items-center p-6 text-center">
      <div className="p-4 h-[50%] flex flex-col items-center justify-between">
        <h1 className="text-4xl font-semibold mb-4">Welcome to Croissant</h1>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate('/home')}
            className="bg-lime-500/15 group-data-hover:bg-lime-500/25 dark:group-data-hover:bg-lime-500/20 text-lime-700 dark:text-lime-400 py-2 px-4 rounded-xl hover:bg-lime-500/20 transition"
          >
            Create Wallet
          </button>
          <button onClick={handleImportClick} className="">
            Import Wallet
          </button>
          <input
            style={{ display: 'none' }}
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  )
}
