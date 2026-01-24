/** WILL BE REMOVED */
import HomePage from './pages/HomePage'
import WelcomePage from './pages/WelcomePage'
import './index.css'
import { Route, Routes } from 'react-router-dom'
import SettingsPage from './pages/SettingsPage'
import ApprovalPopup from './approval/ApprovalPopup'

function App() {
  return (
    <div className="font-ubuntu font-bold relative text-text-inverted w-[370px] h-[600px] flex flex-col items-center justify-center bg-background-light">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/set" element={<WelcomePage />} />
        <Route path="/approve" element={<ApprovalPopup />} />
      </Routes>
    </div>
  )
}

export default App
