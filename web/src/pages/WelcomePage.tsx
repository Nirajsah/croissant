import React from 'react'
import { walletApi } from '../wallet/walletApi'
import { useNavigate } from 'react-router-dom'
import Loading from '@/components/Loading'
import { useWalletStore } from '@/store/wallet'

export default function Welcome() {
  const [loading, setLoading] = React.useState(false)

  const navigate = useNavigate()
  const { importWallet } = useWalletStore()

  async function handleCreate() {
    setLoading(true)
    walletApi
      .createWallet()
      .then(() => {
        setLoading(false)
        navigate('/')
      })
      .catch((err) => {
        console.error('Error creating wallet', err)
      })
  }

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event: any) => {
        const contents = event.target?.result as string
        try {
          // Make sure importWallet fully completes all IndexedDB operations
          await importWallet(contents)
          // Add a small delay to ensure IndexedDB has time to commit the transaction
          setTimeout(() => {
            navigate('/')
          }, 500)
        } catch (error) {
          console.error('Error importing wallet:', error)
          // Handle error here
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="h-full w-full flex flex-col justify-center items-center p-6 text-center text-black">
      {loading ? (
        <Loading />
      ) : (
        <div className="p-4 h-[50%] flex flex-col items-center justify-between">
          <h1 className="text-4xl font-semibold mb-4">Welcome to Croissant</h1>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handleCreate}
              className="bg-rose-500/15 group-data-hover:bg-rose-500/25 dark:group-data-hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 py-2 px-4 rounded-xl hover:bg-rose-500/20 transition"
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
      )}
    </div>
  )
}
