// src/types/partner.ts
export interface Partner {
    id: number
    name: string
    accessToken: string
    createdAt: Date
    lastUsed: Date | null
    showToken: boolean
    // Additional fields you might want:
    // isActive: boolean
    // rateLimit: number
    // permissions: string[]
}

export interface CreatePartnerRequest {
    name: string
    rateLimit?: number
    permissions?: string[]
}

export interface UpdatePartnerRequest {
    name?: string
    rateLimit?: number
    permissions?: string[]
    isActive?: boolean
}