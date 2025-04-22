import HomePage from './components/HomePage'
import Welcome from './components/Welcome'
import React from 'react'
import './index.css'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import WalletProvider from './store/WalletProvider'

function App() {
  return (
    <WalletProvider>
      <div className="font-russo font-thin text-white w-[357px] h-[600px] flex flex-col items-center justify-center bg-black">
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/set" element={<Welcome />} />
          </Routes>
        </MemoryRouter>
      </div>
    </WalletProvider>
  )
}

export default App
