import React from 'react'
import { useWallet } from '../store/WalletProvider'
import { Convert } from '../walletTypes'
import { useNavigate } from 'react-router-dom'
import { walletApi } from '../wallet/walletApi'
import NavBar from '../components/NavBar'
import { WalletFunction } from '../components/WalletFunction'
import { Menu } from '../components/Menu'
import { WalletCard } from '../components/WalletCard'
import Loading from '../components/Loading'
import { checkWalletExists } from '@/utils/CheckWalletExists'

export default function HomePage() {
  const { wallet, isLoading, setWallet, setIsLoading } = useWallet()
  const navigate = useNavigate()
  const [retryCount, setRetryCount] = React.useState(0)

  React.useEffect(() => {
    let timeoutId: any

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
        console.log("Wallet should be here", walletData)

        if (!walletData) {
          navigate('/set')
          return
        }
        setWallet(Convert.toUserChain(walletData))
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
      {/* {wallet.chains && <WalletCard walletChain={Object.values(chains)} />} */}
      {wallet.chains && (
        <div>
          <WalletCard walletChain={Object.values(chains)} />
        </div>
      )}
      <WalletFunction />
      <Menu />
    </div>
  )
}
