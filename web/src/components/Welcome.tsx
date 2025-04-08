import React from 'react'

export default function Welcome() {
  return (
    <div className="h-full w-full flex flex-col justify-center items-center bg-white p-6 text-center">
      <div className="p-4 h-[50%] flex flex-col items-center justify-between">
        <h1 className="text-4xl font-semibold mb-4">Welcome to Croissant</h1>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button className="bg-black text-white py-2 px-4 rounded-xl hover:bg-gray-800 transition">
            Create Wallet
          </button>
          <button className="text-black">Import Wallet</button>
        </div>
      </div>
    </div>
  )
}
