import { useMessage } from '@/MessageProvider'
import { walletApi } from '@/wallet/walletApi'
import { useState } from 'react'

type WalletConnectData = {
  type: string
  requestId: string
  payload: {
    origin: string
    href: string
    title: string
    favicon: string | undefined
  }
  permissions: string[]
  metaData: {
    method: string
    chainId?: string
    timestamp?: string
  }
}

type AssignChainData = {
  type: string
  requestId: string
  payload: {
    origin: string
    href: string
    title: string
    favicon: string | undefined
  }
  permissions: string[]
  metaData: {
    method: string
    chainId: string
    timestamp: string
  }
}

type ApprovalMessage = WalletConnectData | AssignChainData

export default function WalletConnectApproval() {
  const message = useMessage()

  const messagePayload = message.payload as ApprovalMessage

  const [loading, setLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const handleApprove = () => {
    setIsApproving(true)
    setLoading(true)
    try {
      walletApi
        .sendConfirmation({
          status: 'APPROVED',
          requestId: messagePayload.requestId,
          approvalType: messagePayload.type,
          payload: messagePayload.metaData,
        })
        .then(() => {
          setLoading(false)
          setIsRejecting(false)
          window.close()
        })
    } catch (error) {
      console.error('Approval failed:', error)
      setLoading(false)
      setIsApproving(false)
    }
  }

  const handleReject = () => {
    setIsRejecting(true)
    setLoading(true)
    try {
      walletApi
        .sendConfirmation({
          status: 'REJECTED',
          requestId: messagePayload.requestId,
          approvalType: messagePayload.type,
        })
        .then(() => {
          setLoading(false)
          setIsRejecting(false)
          window.close()
        })
    } catch (error) {
      console.error('Rejection failed:', error)
      setLoading(false)
      setIsRejecting(false)
    }
  }

  // Derived fields
  const { origin, href, title, favicon } = messagePayload.payload || {}
  const { method, chainId, timestamp } = messagePayload.metaData || {}

  return (
    <div className="w-[370px] h-[600px]">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="p-3 text-center">
          <p className="mt-1 text-sm text-gray-500">
            Review and approve this request
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 space-y-6">
          {/* dApp card */}
          <div className="border rounded-xl py-2 px-3">
            <div className="flex items-center gap-3">
              <Favicon src={favicon} label={domainInitials(title)} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">{origin}</p>
                <p className="truncate font-semibold text-gray-900">{title}</p>
                <p className="truncate text-xs text-gray-500">{href}</p>
              </div>
            </div>
          </div>

          {/* Transaction/Request details */}
          <div>
            <h2 className="mb-3 font-semibold text-gray-900">
              Request Details
            </h2>
            {/* Method */}
            {messagePayload.type === 'connect_wallet_request' && (
              <div>
                <Row label="Method" value={method} mono />
                <Divider />
              </div>
            )}
            {messagePayload.type === 'assign_chain_request' && (
              <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-3">
                <Row label="Method" value={method} mono />
                <Divider />
                <Row label="ChainId" value={chainId} />
                <Divider />
                <Row label="Timestamp" value={timestamp} />
              </div>
            )}
          </div>

          {/* Permissions (optional) */}
          {messagePayload.permissions.length ? (
            <div>
              <h2 className="mb-3 font-semibold text-gray-900">Permissions</h2>
              <div className="flex flex-wrap gap-2">
                {messagePayload.permissions.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Safety note */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex gap-2">
              <svg
                className="h-5 w-5 text-amber-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              <p className="text-xs text-amber-800">
                Approve only if you trust this site; approval lets the dApp act
                using your wallet session.
              </p>
            </div>
          </div>
        </div>

        {/* Footer (fixed inside container) */}
        <div className="flex px-2 gap-2 py-2">
          <button
            onClick={handleReject}
            disabled={loading}
            className={`w-full rounded-full border-2 border-gray-200 bg-white py-2.5 font-medium transition active:scale-[0.99] ${
              loading
                ? 'cursor-not-allowed text-gray-400'
                : 'hover:bg-gray-50 text-gray-900'
            }`}
            aria-busy={isRejecting}
          >
            {isRejecting ? (
              <Spinner theme="dark" label="Rejecting..." />
            ) : (
              'Reject'
            )}
          </button>

          <button
            onClick={handleApprove}
            disabled={loading}
            className="w-full bg-black rounded-full py-2.5 font-medium text-white transition active:scale-[0.99]"
            aria-busy={isApproving}
          >
            {isApproving ? (
              <Spinner theme="light" label="Confirming..." />
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* --- Helpers & tiny UI atoms (no overflow) --- */
function Spinner({
  theme = 'dark',
  label,
}: {
  theme?: 'light' | 'dark'
  label?: string
}) {
  const isLight = theme === 'light'

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`h-[15px] w-[15px] animate-spin rounded-full border-2 ${
          isLight
            ? 'border-white/50 border-t-white'
            : 'border-gray-400 border-t-gray-900'
        }`}
        style={{
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
        }}
      />
      {label && (
        <span
          className={`text-xs ${isLight ? 'text-white/90' : 'text-gray-700'}`}
        >
          {label}
        </span>
      )}
    </span>
  )
}

function Favicon({ src, label }: { src?: string; label: string }) {
  const [imgError, setImgError] = useState(false)

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={`${label} favicon`}
        className="h-12 w-12 rounded-xl object-cover shadow-sm"
        onError={() => setImgError(true)}
      />
    )
  }

  // Fallback placeholder: first letter of label
  return (
    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 text-white grid place-items-center font-semibold shadow-md">
      {label[0].toUpperCase()}
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value?: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm text-gray-900 ${
          mono ? 'font-mono' : 'font-medium'
        } truncate max-w-[56%]`}
      >
        {value || '—'}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-100" />
}

function domainInitials(host: string) {
  const core = host.replace(/^www\./, '')
  const parts = core.split('.')
  const s = parts[0] || host
  return s.slice(0, 2).toUpperCase()
}

function prettifyDomain(host: string) {
  return host
    .replace(/^www\./, '')
    .split('.')[0]
    .replace(/[-_]/g, ' ')
}

function shortMiddle(s: string, span = 4) {
  if (!s) return ''
  if (s.length <= span * 2 + 3) return s
  return `${s.slice(0, span)}…${s.slice(-span)}`
}

function safeUrl(raw?: string) {
  try {
    return raw ? new URL(raw) : undefined
  } catch {
    return undefined
  }
}

function chainLabel(id?: number) {
  const map: Record<number, string> = {
    1: 'Ethereum Mainnet',
    137: 'Polygon PoS',
    10: 'Optimism',
    42161: 'Arbitrum One',
    8453: 'Base',
    56: 'BNB Chain',
    43114: 'Avalanche C-Chain',
  }
  return id ? map[id] || `Chain ${id}` : 'Unknown'
}

function formatAmount(value?: string | number, decimals = 18, symbol = 'ETH') {
  if (value === undefined || value === null) return '—'
  try {
    const bn =
      typeof value === 'string'
        ? BigInt(value)
        : BigInt(Math.trunc(Number(value)))
    const whole = Number(bn) / 10 ** decimals
    return `${whole.toLocaleString(undefined, {
      maximumFractionDigits: 6,
    })} ${symbol}`
  } catch {
    return `${value} ${symbol}`
  }
}

function formatGas(gas?: string | number, gasPrice?: string | number) {
  if (!gas && !gasPrice) return 'Auto'
  const g = gas ? `${gas}` : ''
  const gp = gasPrice ? `${Number(gasPrice) / 1e9} Gwei` : ''
  return [g, gp].filter(Boolean).join(' • ')
}
