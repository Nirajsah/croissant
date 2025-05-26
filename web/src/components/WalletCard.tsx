import React from 'react'
import { ChainValue } from '@/walletTypes'
import { CirclePlus, Copy, RefreshCw } from 'lucide-react'
import { WalletFunction } from './WalletFunction'

export const WalletCard = ({
  walletChain,
}: {
  walletChain: ChainValue[] | any
}) => {
  const handleCopy = (str: string | undefined) => {
    if (!str) return
    navigator.clipboard.writeText(str)
  }
  const chains = Array.isArray(walletChain) ? walletChain : [walletChain]
  console.log('chains in homepage', chains)

  return (
    // <div className="flex gap-3 flex-col justify-start items-center px-3 w-full mt-2 h-full text-white">
    //   <div className="w-full h-full flex mt-1">
    //     {/* Card with dark blue gradient background */}
    //     <div className="relative w-full flex items-start h-full overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar gap-3">
    //       {chains?.map((chain: any, i: any) => (
    //         <div className="relative w-full min-w-[93%]">
    //           <div
    //             className="absolute w-full bg-gray-800 rounded-2xl h-full transition-all duration-300 ease-in-out"
    //             style={{
    //               left: '5px',
    //               top: '5px',
    //             }}
    //           />
    //           <div
    //             key={i}
    //             className="relative w-full h-full bg-rose-400 p-3 rounded-2xl overflow-hidden snap-center"
    //           >
    //             <div className="relative h-full flex justify-between flex-col">
    //               <div className="flex h-[80px] items-center w-full justify-between">
    //                 <h2 className="text-[45px] font-bold text-white">$0.00</h2>
    //                 <span>
    //                   <svg
    //                     width="45"
    //                     height="45"
    //                     viewBox="0 0 409 409"
    //                     fill="none"
    //                     xmlns="http://www.w3.org/2000/svg"
    //                   >
    //                     <defs>
    //                       <mask
    //                         id="cutout-mask"
    //                         maskUnits="userSpaceOnUse"
    //                         x="0"
    //                         y="0"
    //                         width="409"
    //                         height="409"
    //                       >
    //                         <rect width="409" height="409" fill="white" />
    //                         <path
    //                           d="M145.5 205L174.5 154H233.5L263 205L233.5 255.5H174.5L145.5 205Z"
    //                           fill="black"
    //                         />
    //                         <path
    //                           d="M146 304L131.5 277L277.5 277.5L261.5 304H146Z"
    //                           fill="black"
    //                         />
    //                         <path
    //                           d="M262.5 106L277 133L131 132.5L147 106H262.5Z"
    //                           fill="black"
    //                         />
    //                         <path
    //                           d="M118.24 154L89 205.254L118.744 255H150L121.769 205.254L150 154H118.24Z"
    //                           fill="black"
    //                         />
    //                         <path
    //                           d="M289.76 256L319 204.239L289.256 154H258L286.231 204.239L258 256H289.76Z"
    //                           fill="black"
    //                         />
    //                         <path
    //                           d="M100.5 141L87 118L36 204.5L87.5 291.5L100.5 268.5L64.5 204.5L100.5 141Z"
    //                           fill="black"
    //                         />
    //                         <path
    //                           d="M308 268.5L321.5 291.5L372.5 205L321 118L308 141L344 205L308 268.5Z"
    //                           fill="black"
    //                         />
    //                       </mask>
    //                     </defs>

    //                     <circle
    //                       cx="204.5"
    //                       cy="204.5"
    //                       r="204"
    //                       fill="#be3636"
    //                       mask="url(#cutout-mask)"
    //                     />

    //                     <g fill="none" stroke="black">
    //                       <path d="M145.5 205L174.5 154H233.5L263 205L233.5 255.5H174.5L145.5 205Z" />
    //                       <path d="M146 304L131.5 277L277.5 277.5L261.5 304H146Z" />
    //                       <path d="M262.5 106L277 133L131 132.5L147 106H262.5Z" />
    //                       <path d="M118.24 154L89 205.254L118.744 255H150L121.769 205.254L150 154H118.24Z" />
    //                       <path d="M289.76 256L319 204.239L289.256 154H258L286.231 204.239L258 256H289.76Z" />
    //                       <path d="M100.5 141L87 118L36 204.5L87.5 291.5L100.5 268.5L64.5 204.5L100.5 141Z" />
    //                       <path d="M308 268.5L321.5 291.5L372.5 205L321 118L308 141L344 205L308 268.5Z" />
    //                     </g>
    //                   </svg>
    //                 </span>
    //               </div>
    //               <div className="w-full space-y-2">
    //                 <div className="flex items-center space-x-1">
    //                   {/* <span className="text-xs text-textprimary">Chain:</span> */}
    //                   <span className="truncate py-0.5 text-xs bg-rose-950/20 dark:bg-rose-950/20 text-rose-300 dark:text-rose-300 rounded-full px-1.5">
    //                     {chain.chain_id}
    //                   </span>
    //                   <button
    //                     onClick={() => handleCopy(chain.chain_id)} // change with the actual address
    //                     className="hover:text-white transition p-1 rounded-full"
    //                   >
    //                     <Copy className="w-4 h-4" />
    //                   </button>
    //                 </div>
    //                 <div className="flex items-center space-x-1">
    //                   {/* <span className="text-xs text-textprimary">Owner:</span> */}
    //                   <span className="truncate py-0.5 text-xs bg-rose-950/20 dark:bg-rose-950/20 text-rose-300 dark:text-rose-300 rounded-full px-1.5">
    //                     {chain.key_pair?.Ed25519}
    //                   </span>
    //                   <button
    //                     onClick={() => handleCopy(chain.key_pair?.Ed25519)}
    //                     className="hover:text-white transition"
    //                   >
    //                     <Copy className="w-4 h-4" />
    //                   </button>
    //                 </div>
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //       ))}
    //     </div>
    //   </div>

    //   <WalletFunction />
    // </div>

    <div className="w-full h-full max-h-[200px] flex justify-center items-center mt-2">
      <div className="relative flex justify-center items-center text-white p-6 w-[90%] h-full">
        <svg
          width="335"
          height="200"
          viewBox="0 0 335 200"
          fill=""
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-0 w-full h-full"
        >
          <path
            d="M199 0C221.141 1.57401 219.108 34.6909 238.5 36.5H278.5C316.891 36.9922 328.634 33.4528 334.715 58.6191L335 59.8398V177C335 189.703 324.671 200 311.931 200H23.0693C10.3288 200 0 189.703 0 177V23C1.03397e-06 10.2975 10.3288 0 23.0693 0H199Z"
            fill="#191e1c"
            fill-opacity=""
          />
        </svg>
        <div className="absolute flex flex-col justify-between w-full h-full p-5">
          <div className="w-full h-full">
            <div className="text-xs">Linera</div>
            <div className="text-[48px]">$10.00</div>
          </div>
          <div className="flex justify-between items-center">
            <span>ChainId</span>
            <span>Account</span>
          </div>
        </div>
        <button className="text-black text-xs absolute top-0.5 right-2 border px-3 py-0.5 rounded-3xl flex justify-center items-center gap-1">
          <RefreshCw width={15} />
          sync now
        </button>
      </div>
    </div>
  )
}
