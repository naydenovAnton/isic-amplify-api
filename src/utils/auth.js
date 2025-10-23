// src/utils/auth.js
import { signOut as amplifySignOut } from 'aws-amplify/auth'
import { useRouter } from 'vue-router'

/**
 * Handles user sign out with automatic redirect to auth page
 * @returns {Promise<void>}
 */
export const handleSignOut = async () => {
    try {
        // Get router instance
        const router = useRouter()

        // Perform sign out
        await amplifySignOut()

        // Redirect to auth page
        router.push('/auth')

        console.log('User signed out successfully')
    } catch (error) {
        console.error('Error signing out:', error)
        throw error // Re-throw to let component handle if needed
    }
}

/**
 * Enhanced sign out with options
 * @param {Object} options
 * @param {boolean} options.redirect - Whether to redirect after sign out
 * @param {string} options.redirectTo - Path to redirect to (default: '/auth')
 * @param {boolean} options.forceRedirect - Use window.location for hard redirect
 * @returns {Promise<void>}
 */
export const enhancedSignOut = async (options = {}) => {
    const {
        redirect = true,
        redirectTo = '/auth',
        forceRedirect = false
    } = options

    try {
        await amplifySignOut()
        console.log('User signed out successfully')

        if (redirect) {
            if (forceRedirect) {
                // Hard redirect - completely resets state
                window.location.href = redirectTo
            } else {
                // Soft redirect using Vue Router
                const router = useRouter()
                router.push(redirectTo)
            }
        }
    } catch (error) {
        console.error('Error signing out:', error)
        throw error
    }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export const checkAuthStatus = async () => {
    try {
        const { getCurrentUser } = await import('aws-amplify/auth')
        const user = await getCurrentUser()
        return !!user
    } catch (error) {
        return false
    }
}