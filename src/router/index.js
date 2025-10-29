// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/auth',
        name: 'Auth',
        component: () => import('../screens/Auth.vue'),
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../screens/Dashboard.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/partners',
        name: 'Partners',
        component: () => import('../screens/Partners.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/cards',
        name: 'Cards',
        component: () => import('../screens/Cards.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/fields',
        name: 'Fields',
        component: () => import('../screens/Fields.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/',
        redirect: '/dashboard'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Auth check function
const checkAuth = async () => {
    try {
        // Import inside function to avoid circular dependencies
        const { getCurrentUser } = await import('aws-amplify/auth')
        const user = await getCurrentUser()
        return !!user
    } catch (error) {
        return false
    }
}

router.beforeEach(async (to) => {
    const isAuthenticated = await checkAuth()

    // If route requires auth and user is not authenticated
    if (to.meta.requiresAuth && !isAuthenticated) {
        return '/auth'
    }

    // If user is authenticated and trying to access auth page
    if (to.path === '/auth' && isAuthenticated) {
        return '/dashboard'
    }

    return true
})

export default router