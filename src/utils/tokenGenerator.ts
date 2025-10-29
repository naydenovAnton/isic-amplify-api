// src/utils/tokenGenerator.ts
/**
 * Generates a secure access token for partners
 * Format: {prefix}_sk_{random32chars}
 */
export const generateAccessToken = (partnerName: string): string => {
    // Create prefix from partner name (first 2-3 chars, lowercase, alphanumeric only)
    const prefix = partnerName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 3)

    // Generate random 32 character string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const randomPart = Array.from({ length: 32 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')

    return `${prefix}_sk_${randomPart}`
}

/**
 * Validates token format
 */
export const isValidTokenFormat = (token: string): boolean => {
    const tokenRegex = /^[a-z0-9]{2,3}_sk_[a-zA-Z0-9]{32}$/
    return tokenRegex.test(token)
}

/**
 * Extracts partner prefix from token
 */
export const getPartnerPrefix = (token: string): string | null => {
    const match = token.match(/^([a-z0-9]{2,3})_sk_/)
    return match ? match[1] : null
}

export const validateToken = async (authHeader: string | undefined): Promise<TokenValidationResult> => {
    try {
        // Check if Authorization header exists
        if (!authHeader) {
            return { isValid: false, error: 'Missing Authorization header' };
        }

        // Extract token from "Bearer <token>" format
        const token = authHeader.replace('Bearer ', '').trim();

        if (!token) {
            return { isValid: false, error: 'Invalid token format' };
        }

        // Query active tokens from database
        const result = await client.graphql({
            query: `
        query ListContractorTokens($filter: ModelContractorTokenFilterInput) {
          listContractorTokens(filter: $filter) {
            items {
              id
              token
              expiresAt
              isActive
              contractorId
              contractor {
                id
                name
                isActive
                rateLimit
              }
            }
          }
        }
      `,
            variables: {
                filter: {
                    token: { eq: token },
                    isActive: { eq: true }
                }
            }
        });

        const tokens = result.data?.listContractorTokens?.items || [];

        if (tokens.length === 0) {
            return { isValid: false, error: 'Token not found or inactive' };
        }

        const contractorToken = tokens[0];

        // Check token expiration
        if (new Date(contractorToken.expiresAt) < new Date()) {
            return { isValid: false, error: 'Token expired' };
        }

        // Check if contractor is active
        if (!contractorToken.contractor?.isActive) {
            return { isValid: false, error: 'Contractor account inactive' };
        }

        return {
            isValid: true,
            contractorId: contractorToken.contractorId,
            tokenId: contractorToken.id
        };

    } catch (error) {
        console.error('Token validation error:', error);
        return { isValid: false, error: 'Internal server error during token validation' };
    }
};