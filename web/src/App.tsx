import React from 'react'
import HomePage from './components/HomePage'
import WelcomePage from './components/WelcomePage'
import './index.css'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import WalletProvider from './store/WalletProvider'
import SettingsPage from './components/SettingsPage'
import NavBar from './components/NavBar'

function App() {
  return (
    <WalletProvider>
      <div className="font-russo relative font-thin text-white w-[387px] h-[600px] flex flex-col items-center justify-center bg-black">
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/set" element={<WelcomePage />} />
          </Routes>
        </MemoryRouter>
      </div>
    </WalletProvider>
  )
}

export default App
