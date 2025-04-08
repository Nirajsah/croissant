import React from 'react'

export const TopBar = () => {
  return (
    <div className="flex text-[16px] items-center justify-between px-4 w-full min-h-[65px]">
      <div>Net</div>
      <div className="flex flex-col justify-center items-center">
        <p>Account 1</p>
        <p className="text-sm text-slate-500">0xaji39u3jago3ijag</p>
      </div>
      <div>Con</div>
    </div>
  )
}

export const MainContent = () => {
  return (
    <div className="w-full min-h-[40%] p-4 flex flex-col justify-between">
      <div className="flex justify-center items-center">
        <h2 className="text-[52px] font-bold">$0.00</h2>
      </div>
    </div>
  )
}

export const Menu = () => {
  return (
    <div className="w-full h-full text-[16px]">
      <div className="flex text-md font-bold py-3 justify-around">
        <p>Chains</p>
        <p>Nfts</p>
        <p>Info</p>
      </div>
    </div>
  )
}

export const Footer = () => {
  return (
    <div className="w-full h-[50px] flex justify-center items-center">
      <p className="text-sm text-slate-500">Powered by Croissant</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="w-full h-full flex flex-col">
      <TopBar />
      <MainContent />
      <Menu />
      <Footer />
    </div>
  )
}
