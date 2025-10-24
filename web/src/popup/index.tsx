import ReactDOM from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import '@/index.css'
import HomePage from '@/pages/HomePage'
import SettingsPage from '@/pages/SettingsPage'
import WelcomePage from '@/pages/WelcomePage'
import ApprovalPopup from '@/approval/ApprovalPopup'
import WalletProvider from '@/store/WalletProvider'
import { MessageProvider } from '@/MessageProvider'

// Define your routes
const routes = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '/set',
    element: <WelcomePage />,
  },
  {
    path: '/approve',
    element: <ApprovalPopup />,
  },
]

// Create the memory router
const router = createMemoryRouter(routes, {
  initialEntries: ['/'], // starting route
  initialIndex: 0,
})

// Render the app
const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <WalletProvider>
      <div className="font-ubuntu font-bold relative text-text-inverted w-[370px] h-[600px] flex flex-col items-center justify-center bg-background-light">
        <MessageProvider>
          <RouterProvider router={router} />
        </MessageProvider>
      </div>
    </WalletProvider>
  )
}

// Example: navigate imperatively when a message is received
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'OPEN_APPROVAL_POPUP') {
    router.navigate('/approve')
  }
})
