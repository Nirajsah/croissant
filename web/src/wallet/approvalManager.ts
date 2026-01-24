/**
 * Secure Approval Manager
 * 
 * Handles transaction approval flow with security features:
 * - Request expiry (5 min timeout)
 * - Origin tracking
 * - Cryptographic request IDs
 */

// Sensitive actions that require user approval
export const SENSITIVE_ACTIONS = [
    'CONNECT_WALLET',
    'ASSIGNMENT',
    'TRANSFER',       // Future: token transfers
    'SIGN_MESSAGE',   // Future: message signing
] as const

export type SensitiveAction = typeof SENSITIVE_ACTIONS[number]

export type WrapFunction = (data: any, success?: boolean) => void

// Approval request with full security metadata
export interface SecureApprovalRequest {
    id: string              // crypto.randomUUID()
    type: SensitiveAction
    origin: string          // Requesting dApp origin
    title: string           // dApp title
    favicon: string         // dApp favicon
    href: string            // Full URL
    params: any             // Action-specific parameters
    createdAt: number       // Timestamp for expiry check
    wrap: WrapFunction      // Callback to resolve original request
}

// Data sent to popup (excludes internal callback)
export interface ApprovalRequestData {
    requestId: string
    type: SensitiveAction
    origin: string
    title: string
    favicon: string
    href: string
    params: any
    createdAt: number
}

// Approval timeout: 5 minutes
export const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000

export class ApprovalManager {
    private pendingApprovals = new Map<string, SecureApprovalRequest>()
    private cleanupInterval: ReturnType<typeof setInterval> | null = null

    constructor() {
        // Start periodic cleanup of expired approvals
        this.startCleanupInterval()
    }

    /**
     * Create a new approval request
     */
    createRequest(
        type: SensitiveAction,
        origin: string,
        title: string,
        favicon: string,
        href: string,
        params: any,
        wrap: WrapFunction
    ): string {
        const id = crypto.randomUUID()

        const request: SecureApprovalRequest = {
            id,
            type,
            origin,
            title,
            favicon,
            href,
            params,
            createdAt: Date.now(),
            wrap
        }

        this.pendingApprovals.set(id, request)
        console.log(`[ApprovalManager] Created request ${id} for ${type} from ${origin}`)

        return id
    }

    /**
     * Get a pending approval by ID (validates expiry)
     */
    getRequest(id: string): SecureApprovalRequest | null {
        const request = this.pendingApprovals.get(id)

        if (!request) {
            return null
        }

        // Check if expired
        if (this.isExpired(request)) {
            console.warn(`[ApprovalManager] Request ${id} has expired`)
            this.rejectAndRemove(id, 'Request expired')
            return null
        }

        return request
    }

    /**
     * Get all pending approvals (for popup to pull)
     * Returns data safe to send to UI (no internal callbacks)
     */
    getPendingApprovals(): ApprovalRequestData[] {
        const pending: ApprovalRequestData[] = []

        this.pendingApprovals.forEach((request, id) => {
            if (!this.isExpired(request)) {
                pending.push({
                    requestId: request.id,
                    type: request.type,
                    origin: request.origin,
                    title: request.title,
                    favicon: request.favicon,
                    href: request.href,
                    params: request.params,
                    createdAt: request.createdAt
                })
            } else {
                // Clean up expired during iteration
                this.rejectAndRemove(id, 'Request expired')
            }
        })

        return pending
    }

    /**
     * Resolve an approval request (approve or reject)
     */
    resolveRequest(
        id: string,
        approved: boolean,
        executeAction: (request: SecureApprovalRequest) => Promise<void>
    ): { success: boolean; error?: string } {
        const request = this.getRequest(id)

        if (!request) {
            return { success: false, error: 'Request not found or expired' }
        }

        this.pendingApprovals.delete(id)

        if (!approved) {
            request.wrap('User rejected the request', false)
            console.log(`[ApprovalManager] Request ${id} rejected by user`)
            return { success: true }
        }

        // Execute the action
        executeAction(request)
            .then(() => {
                console.log(`[ApprovalManager] Request ${id} approved and executed`)
            })
            .catch((err) => {
                console.error(`[ApprovalManager] Request ${id} execution failed:`, err)
                request.wrap(String(err), false)
            })

        return { success: true }
    }

    /**
     * Check if a request has expired
     */
    private isExpired(request: SecureApprovalRequest): boolean {
        return Date.now() - request.createdAt > APPROVAL_TIMEOUT_MS
    }

    /**
     * Reject and remove an expired/invalid request
     */
    private rejectAndRemove(id: string, reason: string): void {
        const request = this.pendingApprovals.get(id)
        if (request) {
            request.wrap(reason, false)
            this.pendingApprovals.delete(id)
        }
    }

    /**
     * Start periodic cleanup of expired approvals
     */
    private startCleanupInterval(): void {
        // Run cleanup every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired()
        }, 60 * 1000)
    }

    /**
     * Clean up all expired approvals
     */
    private cleanupExpired(): void {
        let cleaned = 0

        this.pendingApprovals.forEach((request, id) => {
            if (this.isExpired(request)) {
                this.rejectAndRemove(id, 'Request expired')
                cleaned++
            }
        })

        if (cleaned > 0) {
            console.log(`[ApprovalManager] Cleaned up ${cleaned} expired requests`)
        }
    }

    /**
     * Check if an action type requires approval
     */
    static requiresApproval(actionType: string): actionType is SensitiveAction {
        return SENSITIVE_ACTIONS.includes(actionType as SensitiveAction)
    }

    /**
     * Stop the cleanup interval (for testing/cleanup)
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval)
            this.cleanupInterval = null
        }
    }
}
