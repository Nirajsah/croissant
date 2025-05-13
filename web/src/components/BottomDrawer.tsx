import { useWallet } from '../store/WalletProvider'
import React, { useEffect, useState } from 'react'

type Field = {
  title: string
  data: string
}

type DrawerData = {
  action: Field
  from: Field
  to: Field
  amount?: Field
  est_gas: Field
}

export default function BottomDrawer() {
  const { drawerOpen, setDrawerOpen } = useWallet()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimatingIn, setIsAnimatingIn] = useState(false)

  useEffect(() => {
    let timeout

    if (drawerOpen) {
      // First make the drawer visible in DOM
      setIsVisible(true)
      // Then trigger animation after a small delay to ensure CSS transition works
      timeout = setTimeout(() => setIsAnimatingIn(true), 10)
    } else {
      // Start closing animation
      setIsAnimatingIn(false)
      // Then remove from DOM after animation completes
      timeout = setTimeout(() => setIsVisible(false), 500)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [drawerOpen])

  // Don't render anything if the drawer shouldn't be visible
  if (!isVisible) return null

  function handleDrawerClose() {
    setDrawerOpen(false)
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ease-in-out ${
          isAnimatingIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => handleDrawerClose}
        style={{ pointerEvents: isAnimatingIn ? 'auto' : 'none' }}
      />

      <div
        className="fixed left-0 right-0 bottom-0 z-50 transition-transform h-[70%] duration-500 ease-out"
        style={{
          transform: isAnimatingIn ? 'translateY(0)' : 'translateY(100%)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          maxHeight: '70%',
          willChange: 'transform',
        }}
      >
        <div className="bg-[#09090b] flex flex-col gap-4 items-center justify-between h-full rounded-t-2xl overflow-hidden border-t border-[#ffffff24] p-4">
          <div onClick={handleDrawerClose} className="flex justify-center p-1">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
          <div className="w-full h-full flex justify-between flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-md font-semibold mb-1">Confirm Operation</h2>
              <p className="text-gray-400 text-xs">
                Please review the operation details before proceeding.
              </p>
            </div>

            {/** main content */}
            <div className="w-full flex flex-col gap-1 text-sm text-white">
              <div className="flex flex-col gap-3 border border-[#ffffff24] p-3 rounded-lg bg-[#0d0d11]">
                <div className="">
                  <div className="text-xs text-gray-400">Action</div>
                  <div className="font-medium text-sm">Send Tokens</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Amount</div>
                  <div className="font-medium text-sm">0.25 ETH</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Recipient</div>
                  <div className="font-mono text-sm truncate">0x8a9...9e32</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Estimated Gas Fee</div>
                  <div className="font-medium text-sm">~0.0012 ETH</div>
                </div>
              </div>
            </div>

            {/** Buttons */}
            <div className="w-full flex gap-3">
              <button
                onClick={handleDrawerClose}
                className="w-full rounded-xl border text-white border-[#ffffff24] px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDrawerClose}
                className="w-full rounded-xl text-black bg-white px-4 py-2"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
