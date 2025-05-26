import React from 'react'
import { useWallet } from '../store/WalletProvider'
import { ChainValue, Convert } from '../walletTypes'
import { useNavigate } from 'react-router-dom'
import { walletApi } from '../wallet/walletApi'
import NavBar from '../components/NavBar'
import { WalletFunction } from '../components/WalletFunction'
import { Menu } from '../components/Menu'
import { checkWalletExists } from '../utils/CheckWalletExists'
import { WalletCard } from '../components/WalletCard'

export default function HomePage() {
  // const { wallet, isLoading, setWallet, setIsLoading } = useWallet()
  // const navigate = useNavigate()
  // const [retryCount, setRetryCount] = React.useState(0)

  // React.useEffect(() => {
  //   let timeoutId: NodeJS.Timeout

  //   async function wakeUp() {
  //     await walletApi.ping()
  //   }
  //   wakeUp()

  //   const fetchWallet = async () => {
  //   const walletExists = await checkWalletExists()
  //     if (!walletExists) {
  //       navigate('/set')
  //       return
  //     }
  //     try {
  //       const walletData = await walletApi.getWallet()
  //       console.log('wallet data', walletData)
  //       if (!walletData) {
  //         navigate('/set')
  //         return
  //       }
  //       setWallet(Convert.toWallet(walletData))
  //       setIsLoading(false)
  //     } catch (error) {
  //       console.error(
  //         `Error fetching wallet (attempt ${retryCount + 1}/3):`,
  //         error
  //       )
  //       if (retryCount < 2) {
  //         setRetryCount((prev) => prev + 1)
  //         timeoutId = setTimeout(fetchWallet, 1000)
  //       } else {
  //         navigate('/set')
  //       }
  //     }
  //   }

  //   timeoutId = setTimeout(fetchWallet, 1000)

  //   return () => clearTimeout(timeoutId)
  // }, [navigate, setWallet, retryCount])

  // if (isLoading) {
  //   return <Loading />
  // }

  // if (!wallet) {
  //   setIsLoading(true)
  //   return
  // }

  // const { chains } = wallet

  const chain = {
    chain_id: 'abce',
    key_pair: {
      Ed25519: 'ajeaog4a',
    },
    block_hash: null,
    timestamp: 1033433333,
    next_block_height: 1,
    pending_proposal: null,
  }

  return (
    <div className="w-full h-full flex flex-col relative">
      <NavBar />
      {/* {wallet.chains && <WalletCard walletChain={Object.values(chains)} />} */}
      <WalletCard walletChain={chain} />
      <WalletFunction />
      <Menu />
    </div>
  )
}
