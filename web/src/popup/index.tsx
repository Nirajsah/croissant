import ReactDOM from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import '@/index.css'
import HomePage from '@/pages/HomePage'
import SettingsPage from '@/pages/SettingsPage'
import WelcomePage from '@/pages/WelcomePage'
import ApprovalPopup from '@/approval/ApprovalPopup'

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

const router = createMemoryRouter(routes, {
  initialEntries: ['/'],
  initialIndex: 0,
})

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <div className="font-ubuntu overflow-hidden font-bold relative text-text-inverted w-[370px] h-[600px] flex flex-col items-center justify-center bg-background-light">
      <RouterProvider router={router} />
    </div>
  )
}
