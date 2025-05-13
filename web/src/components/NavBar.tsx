import { Info, MoreVertical, PlusCircle, Settings } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NavBar = () => {
  const [showMenu, setShowMenu] = useState(false)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const highlightRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (
      hoverIndex !== null &&
      itemRefs.current[hoverIndex] &&
      highlightRef.current
    ) {
      const el = itemRefs.current[hoverIndex]
      highlightRef.current.style.top = `${el?.offsetTop}px`
    }
  }, [hoverIndex])

  const menuOptions = [
    {
      option: {
        icon: <PlusCircle className="w-4 h-4" />,
        name: 'New Chain',
      },
    },
    {
      option: {
        icon: <Settings className="w-4 h-4" />,
        name: 'Settings',
      },
    },
    {
      option: {
        icon: <Info className="w-4 h-4" />,
        name: 'info',
      },
    },
  ]

  function handleMenuOperation(option: any) {
    if (option.name === 'Settings') {
      navigate('/settings')
    }
  }

  return (
    <div className="flex items-center justify-between px-4 w-full min-h-[65px] shadow-sm border-b border-[#ffffff24]">
      <div className="font-medium">Net</div>
      <div onClick={() => navigate('/')} className="cursor-pointer text-lg">
        Croissant
      </div>
      <div
        onClick={() => setShowMenu(!showMenu)}
        className="font-medium p-1 flex items-center gap-5 cursor-pointer"
      >
        <MoreVertical className="w-5 h-5 cursor-pointer" />
      </div>
      {showMenu && (
        <div
          onClick={() => setShowMenu(false)}
          className="absolute top-0 w-full h-full z-100"
        >
          <div className="absolute transition-transform duration-500 border border-lime-400/10 z-50 w-full max-w-[180px] bg-black rounded-md right-6 top-12 overflow-hidden shadow-lg">
            {/* Hover highlight */}
            <div
              ref={highlightRef}
              className="absolute w-full h-[32px] bg-lime-600/10 transition-all duration-200 ease-in-out pointer-events-none"
            />
            <div className="relative flex flex-col">
              {menuOptions.map((menu, index) => (
                <div
                  onClick={() => handleMenuOperation(menu.option)}
                  key={index}
                  ref={(el) => (itemRefs.current[index] = el)}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer text-xs text-gray-300 hover:text-lime-400 transition"
                >
                  {menu.option.icon}
                  {menu.option.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NavBar
