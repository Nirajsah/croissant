import { walletApi } from '../wallet/walletApi'
import { ChevronDown, MoreVertical, PlusCircle, Settings } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import Linera from '../assets/Linera_Red_Mark.svg'

const NavBar = () => {
  const [showMenu, setShowMenu] = React.useState(false)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
  const highlightRef = React.useRef<HTMLDivElement | null>(null)
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const navigate = useNavigate()

  React.useEffect(() => {
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
        name: 'New MicroChain',
      },
    },
    {
      option: {
        icon: <Settings className="w-4 h-4" />,
        name: 'Settings',
      },
    },
  ]

  async function handleMenuOperation(option: any) {
    if (option.name === 'Settings') {
      navigate('/settings')
    } else if (option.name === 'New MicroChain') {
      await walletApi.createChain() // Maybe add loading, or confirmation.
    }
  }

  return (
    <div className="flex items-center justify-between px-4 w-full min-h-[65px] shadow-sm border-b border-[#ffffff24] text-black">
      <div className="flex cursor-pointer items-center text-sm bg-rose-500/15 group-data-hover:bg-rose-500/25 dark:group-data-hover:bg-rose-500/20 px-2 py-0.5 rounded-3xl">
        <img className="w-6 h-6" src={Linera} alt="Linera" />
        <ChevronDown className="w-4 h-4" />
      </div>
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
          <div className="absolute bg-white transition-transform duration-500 border border-rose-400/10 z-50 w-full max-w-[180px] rounded-md right-6 top-12 overflow-hidden shadow-lg">
            {/* Hover highlight */}
            <div
              ref={highlightRef}
              className="absolute w-full h-[32px] bg-rose-600/10 transition-all duration-200 ease-in-out pointer-events-none"
            />
            <div className="relative flex flex-col">
              {menuOptions.map((menu, index) => (
                <div
                  onClick={() => handleMenuOperation(menu.option)}
                  key={index}
                  ref={(el) => (itemRefs.current[index] = el)}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                  className="flex items-center gap-3 px-4 py-2 cursor-pointer text-xs hover:text-rose-400 transition"
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
