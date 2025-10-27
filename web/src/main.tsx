/** USED FOR LOCAL TESTING, WILL BE REMOVED */
import ReactDOM from 'react-dom/client'
import './index.css'
import { WalletCard } from './components/WalletCardDemo'

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <div className="w-full h-full flex flex-col relative">
      <WalletCard />
    </div>
  )
}
