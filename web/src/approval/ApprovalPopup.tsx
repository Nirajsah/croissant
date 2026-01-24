import { walletApi } from '@/wallet/walletApi'
import { useState, useEffect } from 'react'

// Type matching ApprovalRequestData from approvalManager.ts
interface ApprovalRequestData {
  requestId: string
  type: string
  origin: string
  title: string
  favicon: string
  href: string
  params: any
  createdAt: number
}

export default function ApprovalPopup() {
  const [approval, setApproval] = useState<ApprovalRequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // SECURITY: Pull approval data from trusted server on mount
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        const pending = await walletApi.getPendingApprovals()
        if (pending && pending.length > 0) {
          // Display the first pending approval
          setApproval(pending[0])
        } else {
          setError('No pending approvals')
        }
      } catch (err) {
        console.error('Failed to fetch pending approvals:', err)
        setError('Failed to load approval request')
      } finally {
        setLoading(false)
      }
    }

    fetchPendingApprovals()
  }, [])

  const handleApprove = async () => {
    if (!approval) return

    setIsApproving(true)
    try {
      await walletApi.sendConfirmation({
        status: 'APPROVED',
        requestId: approval.requestId,
        approvalType: approval.type,
      })
      window.close()
    } catch (err) {
      console.error('Approval failed:', err)
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!approval) return

    setIsRejecting(true)
    try {
      await walletApi.sendConfirmation({
        status: 'REJECTED',
        requestId: approval.requestId,
        approvalType: approval.type,
      })
      window.close()
    } catch (err) {
      console.error('Rejection failed:', err)
      setIsRejecting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="w-[370px] h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading request...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !approval) {
    return (
      <div className="w-[370px] h-[600px] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-gray-500">{error || 'No pending approval requests'}</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const isProcessing = isApproving || isRejecting

  return (
    <div className="w-[370px] h-[600px]">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="p-3 text-center border-b">
          <p className="text-sm text-gray-500">
            Review and approve this request
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {/* SECURITY: Origin prominently displayed */}
          <div className="border rounded-xl py-3 px-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <Favicon src={approval.favicon} title={approval.title} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{approval.title}</p>
                <p className="text-sm text-gray-600 truncate">{approval.origin}</p>
              </div>
            </div>
          </div>

          {/* Request Type Badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {formatActionType(approval.type)}
            </span>
          </div>

          {/* Request Details */}
          <div className="border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Request Details</h3>
            <Row label="Action" value={formatActionType(approval.type)} />
            <Divider />
            <Row label="Origin" value={approval.origin} />
            {approval.type === 'ASSIGNMENT' && approval.params?.chainId && (
              <>
                <Divider />
                <Row label="Chain ID" value={truncateMiddle(approval.params.chainId, 20)} mono />
              </>
            )}
          </div>

          {/* Security Warning */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex gap-2">
              <svg className="h-5 w-5 text-amber-700 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-xs text-amber-800">
                Only approve if you trust <strong>{approval.origin}</strong>.
                This action may modify your wallet state.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex px-3 gap-3 py-3 border-t">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className={`flex-1 rounded-full border-2 border-gray-200 bg-white py-2.5 font-medium transition ${isProcessing ? 'cursor-not-allowed text-gray-400' : 'hover:bg-gray-50 text-gray-900'
              }`}
          >
            {isRejecting ? <Spinner theme="dark" label="Rejecting..." /> : 'Reject'}
          </button>

          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex-1 bg-black rounded-full py-2.5 font-medium text-white transition hover:bg-gray-800"
          >
            {isApproving ? <Spinner theme="light" label="Approving..." /> : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* --- Helper Components --- */

function Spinner({ theme = 'dark', label }: { theme?: 'light' | 'dark'; label?: string }) {
  const isLight = theme === 'light'
  return (
    <span className="inline-flex items-center gap-2 justify-center">
      <span
        className={`h-4 w-4 animate-spin rounded-full border-2 ${isLight ? 'border-white/50 border-t-white' : 'border-gray-400 border-t-gray-900'
          }`}
        style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
      />
      {label && <span className={`text-xs ${isLight ? 'text-white/90' : 'text-gray-700'}`}>{label}</span>}
    </span>
  )
}

function Favicon({ src, title }: { src?: string; title: string }) {
  const [imgError, setImgError] = useState(false)

  const fallbackText = title ? title.slice(0, 2).toUpperCase() : '??'

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={title}
        className="h-10 w-10 rounded-xl object-cover"
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 text-white grid place-items-center font-semibold text-sm">
      {fallbackText}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm text-gray-900 ${mono ? 'font-mono text-xs' : 'font-medium'} truncate max-w-[60%]`}>
        {value || '—'}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-100" />
}

function formatActionType(type: string): string {
  const map: Record<string, string> = {
    'CONNECT_WALLET': 'Connect Wallet',
    'ASSIGNMENT': 'Assign Chain',
    'TRANSFER': 'Transfer',
    'SIGN_MESSAGE': 'Sign Message',
  }
  return map[type] || type
}

function truncateMiddle(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str
  const half = Math.floor((maxLen - 3) / 2)
  return `${str.slice(0, half)}...${str.slice(-half)}`
}
