import React from 'react'
import { useNavigate } from 'react-router-dom'
import { walletApi } from '../wallet/walletApi'
import NavBar from '../components/NavBar'
import { WalletFunction } from '../components/WalletFunction'
import { Menu } from '../components/Menu'
import Loading from '../components/Loading'
import { useWalletStore } from '@/store/wallet'
import { WalletCard } from '@/components/WalletCard'
import { checkWalletExists } from '@/utils/CheckWalletExists'

export default function HomePage() {
  const navigate = useNavigate()
  const { wallet, fetchWalletAsync, isLoading } = useWalletStore((s) => s)

  const retryCountRef = React.useRef(0)

  React.useEffect(() => {
    let timeoutId: any
    let isMounted = true // Prevents state updates if component unmounts

    async function wakeUp() {
      try {
        await walletApi.ping()
      } catch (e) {
        console.log('Ping failed', e)
      }
    }

    const fetchWallet = async () => {
      // 2. Wake up first
      await wakeUp()

      // Check for pending approvals
      try {
        const pending = await walletApi.getPendingApprovals()
        if (pending && pending.length > 0) {
          navigate('/approve')
          return
        }
      } catch (e) { /* ignore */ }

      const walletExists = await checkWalletExists()
      if (!walletExists) {
        navigate('/set')
        return
      }

      // 3. Attempt to fetch
      fetchWalletAsync()
        .then(() => {
          if (isMounted) {
            console.log('wallet fetched successfully')
          }
        })
        .catch(() => {
          if (!isMounted) return

          if (retryCountRef.current < 3) {
            retryCountRef.current += 1 // Increment ref
            console.log(`Retrying... Attempt ${retryCountRef.current}`)

            timeoutId = setTimeout(fetchWallet, 1000)
          } else {
            navigate('/set')
          }
        })
    }

    fetchWallet()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [navigate, fetchWalletAsync])

  if (isLoading) {
    return <Loading />
  }

  if (!wallet) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">
          No wallet found. Please set up your wallet.
        </p>
      </div>
    )
  }

  const { chains, default: defaultChain } = wallet

  return (
    <div className="w-full h-full flex flex-col relative">
      <NavBar />
      {wallet.chains && (
        <div>
          <WalletCard walletChain={chains} defaultChain={defaultChain} />
        </div>
      )}
      <WalletFunction />
      <Menu />
    </div>
  )
}
