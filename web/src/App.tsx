import React from 'react'
import HomePage from './pages/HomePage'
import WelcomePage from './pages/WelcomePage'
import './index.css'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import WalletProvider from './store/WalletProvider'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <WalletProvider>
      <div className="font-ubuntu font-bold relative text-text-inverted w-[370px] h-[620px] flex flex-col items-center justify-center bg-background-light">
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
