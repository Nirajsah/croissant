import HomePage from './components/HomePage'
import Welcome from './components/Welcome'
import React from 'react'
import './index.css'

function App() {
  return (
    <div className="font-oswald text-white w-[357px] h-[600px] flex flex-col items-center justify-center bg-[#18181b]">
      <Welcome />
    </div>
  )
}

export default App
