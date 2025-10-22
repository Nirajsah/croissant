import { useMessage } from '@/MessageProvider'
import { walletApi } from '@/wallet/walletApi'
import { useState } from 'react'

interface ApprovalMessage {
  type: string
  requestId: string
  origin: string
  favicon?: string
  permissions?: string[]
  data?: any
  timestamp?: number
}

// Mock data for testing UI
const MOCK_DATA: ApprovalMessage = {
  type: 'REQUEST_CONNECTION',
  requestId: 'mock_req_12345',
  origin: 'https://uniswap.org',
  favicon: 'https://uniswap.org/favicon.ico',
  permissions: [
    'View your wallet address',
    'Request approval for transactions',
    'View your account balance',
    'Suggest transactions to sign',
  ],
  timestamp: Date.now(),
}

// Toggle this to switch between mock and real data
const USE_MOCK_DATA = true

const Approval = () => {
  const realMessage = useMessage() as ApprovalMessage
  const message = USE_MOCK_DATA ? MOCK_DATA : realMessage

  const [loading, setLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  console.log('ApprovalPopup received message:', message)

  const handleApprove = async () => {
    setIsApproving(true)
    setLoading(true)

    if (USE_MOCK_DATA) {
      // Simulate API call for mock data
      console.log('✅ MOCK: Approving connection...', message)
      walletApi.sendConfirmation('Connection approved by user.')
      setTimeout(() => {
        console.log('✅ MOCK: Connection approved!')
        setLoading(false)
        setIsApproving(false)
        // Don't close window in mock mode for testing
      }, 1500)
      return
    }

    try {
      walletApi.sendConfirmation('Connection approved by user.')
      setTimeout(() => window.close(), 300)
    } catch (error) {
      console.error('Approval failed:', error)
      setLoading(false)
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    setLoading(true)

    if (USE_MOCK_DATA) {
      // Simulate API call for mock data
      console.log('❌ MOCK: Rejecting connection...', message)
      setTimeout(() => {
        console.log('❌ MOCK: Connection rejected!')
        alert('Mock: Connection Rejected!')
        setLoading(false)
        setIsRejecting(false)
        // Don't close window in mock mode for testing
      }, 1500)
      return
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'REJECT_CONNECTION',
        requestId: message.requestId,
      })
      walletApi.sendConfirmation('Connection rejected by user.')
      setTimeout(() => window.close(), 300)
    } catch (error) {
      console.error('Rejection failed:', error)
      setLoading(false)
      setIsRejecting(false)
    }
  }

  if (!message) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin animation-delay-150" />
          </div>
          <p className="text-gray-600 font-medium animate-pulse">
            Loading request...
          </p>
        </div>
      </div>
    )
  }

  // Extract hostname and format it
  const hostname = message.origin
    ? new URL(message.origin).hostname
    : 'Unknown Site'
  const protocol = message.origin ? new URL(message.origin).protocol : 'https:'
  const isSecure = protocol === 'https:'

  // Default permissions if not provided
  const permissions = message.permissions || [
    'View your wallet address',
    'Request approval for transactions',
    'View your account balance',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Mock Data Banner */}
      {USE_MOCK_DATA && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-6 py-2 rounded-full shadow-lg font-bold text-sm z-50 animate-pulse">
          🎨 MOCK DATA MODE - For UI Testing
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all duration-300 hover:shadow-3xl">
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-6 py-10 text-white overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Favicon/Icon */}
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
              <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-white/30 transform transition-transform hover:scale-105">
                {message.favicon ? (
                  <img
                    src={message.favicon}
                    alt="Site icon"
                    className="w-12 h-12 rounded-xl object-cover"
                    onError={(e) => {
                      // Fallback to emoji if image fails to load
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML =
                        '<div class="text-4xl">🌐</div>'
                    }}
                  />
                ) : (
                  <div className="text-4xl">🌐</div>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center mb-2 tracking-tight">
              Connection Request
            </h1>

            {/* Hostname with security badge */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              {isSecure ? (
                <svg
                  className="w-4 h-4 text-green-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-yellow-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="text-sm font-semibold">{hostname}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-6 space-y-5">
          {/* Warning Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">
                  Verify This Website
                </h3>
                <p className="text-xs text-gray-700 break-all font-mono bg-white/60 px-2 py-1 rounded mb-2">
                  {message.origin}
                </p>
                <p className="text-xs text-amber-800 font-semibold">
                  ⚡ Only approve if you trust this website
                </p>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-base">
                This site will be able to:
              </h3>
            </div>

            <div className="space-y-2">
              {permissions.map((permission, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-2.5 h-2.5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-sm shadow-emerald-500/50 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 font-medium flex-1">
                    {permission}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-5 border border-blue-100 shadow-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="font-bold text-gray-900 text-sm">
                  Security Notice
                </h4>
                <div className="text-xs text-gray-700 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>View your account address and balance</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Request approval for transactions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">✗</span>
                    <span className="font-semibold">
                      Cannot move funds without your explicit approval
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          {message.timestamp && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Request received:{' '}
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 group relative px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 hover:border-gray-400 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md hover:shadow-lg overflow-hidden"
          >
            {isRejecting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Rejecting...
              </span>
            ) : (
              <>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Reject
                </span>
              </>
            )}
          </button>

          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 group relative px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {isApproving ? (
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Approving...
              </span>
            ) : (
              <>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Approve Connection
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Approval
