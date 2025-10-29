<!-- views/Partners.vue -->
<template>
  <div class="partners">
    <AppHeader title="Partners" @sign-out="handleSignOut" />

    <main class="partners-content p-4">
      <div class="container-fluid">
        <!-- Header Section -->
        <div class="mb-5">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 class="h3 mb-1 fw-bold">Partner Management</h1>
              <p class="text-muted mb-0">{{ partners.length }} active partner{{ partners.length !== 1 ? 's' : '' }}</p>
            </div>
            <button
                @click="showAddModal = true"
                class="btn btn-primary"
                :disabled="loading"
            >
              <i class="bi bi-plus-circle me-2"></i>
              {{ loading ? 'Loading...' : 'Add Partner' }}
            </button>
          </div>

          <!-- Stats Row -->
          <div class="row g-3">
            <div class="col-md-2">
              <div class="card border bg-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <p class="text-muted small mb-1">Total Partners</p>
                      <h5 class="mb-0">{{ partners.length }}</h5>
                    </div>
                    <i class="bi bi-people-fill text-primary" style="font-size: 1.5rem;"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="card border bg-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <p class="text-muted small mb-1">Active Partners</p>
                      <h5 class="mb-0">{{ partners.filter(p => p.isActive).length }}</h5>
                    </div>
                    <i class="bi bi-check-circle-fill text-success" style="font-size: 1.5rem;"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="card border bg-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <p class="text-muted small mb-1">Total Tokens</p>
                      <h5 class="mb-0">{{ totalTokenCount }}</h5>
                    </div>
                    <i class="bi bi-key-fill text-warning" style="font-size: 1.5rem;"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="card border bg-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <p class="text-muted small mb-1">Active Tokens</p>
                      <h5 class="mb-0">{{ activeTokenCount }}</h5>
                    </div>
                    <i class="bi bi-lightning-fill text-info" style="font-size: 1.5rem;"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="card border bg-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <p class="text-muted small mb-1">Assigned Cards</p>
                      <h5 class="mb-0">{{ totalCardAssignments }}</h5>
                    </div>
                    <i class="bi bi-credit-card-fill text-success" style="font-size: 1.5rem;"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="card border bg-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <p class="text-muted small mb-1">Available Cards</p>
                      <h5 class="mb-0">{{ availableCards.length }}</h5>
                    </div>
                    <i class="bi bi-card-list text-primary" style="font-size: 1.5rem;"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted">Loading partners...</p>
        </div>

        <!-- Partners List -->
        <div v-else>
          <div v-if="partners.length === 0" class="card border-0 bg-light">
            <div class="card-body text-center py-5">
              <i class="bi bi-inbox display-4 text-muted mb-3 d-block"></i>
              <h5 class="text-muted mb-2">No partners yet</h5>
              <p class="text-muted mb-4">Get started by adding your first partner</p>
              <button @click="showAddModal = true" class="btn btn-primary">
                <i class="bi bi-plus-circle me-2"></i>Add First Partner
              </button>
            </div>
          </div>

          <div v-else class="row g-3">
            <div
                v-for="partner in partners"
                :key="partner.id"
                class="col-12"
            >
              <div class="card border h-100" :class="{ 'opacity-75': !partner.isActive }">
                <!-- Card Header -->
                <div class="card-header border-0 border-bottom pb-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <h5 class="card-title mb-2">{{ partner.name }}</h5>
                      <div class="d-flex gap-2 flex-wrap">
                        <span class="badge" :class="partner.isActive ? 'bg-success' : 'bg-secondary'">
                          {{ partner.isActive ? 'Active' : 'Inactive' }}
                        </span>
                        <span class="badge bg-info">
                          <i class="bi bi-speedometer2 me-1"></i>{{ partner.rateLimit }}/hr
                        </span>
                        <span class="badge bg-primary">
                          <i class="bi bi-credit-card me-1"></i>{{ partner.contractorCards?.items?.length || 0 }} cards
                        </span>
                      </div>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                      <button
                          @click="manageCards(partner)"
                          class="btn btn-sm btn-outline-primary"
                          title="Manage cards"
                      >
                        <i class="bi bi-credit-card me-1"></i>Manage Cards
                      </button>
                      <button
                          @click="editPartner(partner)"
                          class="btn btn-sm btn-outline-secondary"
                          title="Edit partner"
                      >
                        <i class="bi bi-pencil me-1"></i>Edit
                      </button>
                      <button
                          @click="togglePartnerStatus(partner)"
                          class="btn btn-sm"
                          :class="partner.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                          :title="partner.isActive ? 'Deactivate' : 'Activate'"
                      >
                        <i :class="partner.isActive ? 'bi bi-pause me-1' : 'bi bi-play me-1'"></i>
                        {{ partner.isActive ? 'Pause' : 'Resume' }}
                      </button>
                      <button
                          @click="deletePartner(partner.id)"
                          class="btn btn-sm btn-outline-danger"
                          title="Delete partner"
                      >
                        <i class="bi bi-trash me-1"></i>Delete
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Card Body -->
                <div class="card-body">
                  <p class="text-muted mb-3">
                    <i class="bi bi-envelope me-2"></i>{{ partner.email }}
                  </p>

                  <!-- Cards Section -->
                  <div class="cards-section mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h6 class="mb-0">Assigned Cards</h6>
                      <span class="badge bg-secondary">{{ partner.contractorCards?.items?.length || 0 }}</span>
                    </div>

                    <div v-if="partner.contractorCards?.items?.length" class="assigned-cards">
                      <div class="row g-2">
                        <div
                            v-for="contractorCard in partner.contractorCards.items"
                            :key="contractorCard.id"
                            class="col-md-6"
                        >
                          <div class="card assigned-card border bg-light p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                              <div class="flex-grow-1">
                                <h6 class="mb-1">{{ contractorCard.card?.name }}</h6>
                                <p class="text-muted small mb-1">{{ contractorCard.card?.type }}</p>
                              </div>
                              <div class="d-flex gap-1">
                                <span class="badge bg-success" style="font-size: 0.7rem;">
                                  {{ contractorCard.discountPercent }}% off
                                </span>
                                <button
                                    @click="removeCardAssignment(partner.id, contractorCard.id)"
                                    class="btn btn-xs btn-ghost text-danger"
                                    title="Remove card"
                                >
                                  <i class="bi bi-x-lg"></i>
                                </button>
                              </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                              <small class="text-muted">
                                ${{ contractorCard.card?.price }}
                              </small>
                              <small class="text-muted" :class="{ 'text-danger': !contractorCard.card?.isActive }">
                                {{ contractorCard.card?.isActive ? 'Active' : 'Inactive' }}
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else class="text-center py-3 bg-light rounded">
                      <i class="bi bi-credit-card text-muted" style="font-size: 1.5rem;"></i>
                      <p class="text-muted small mt-2 mb-0">No cards assigned yet</p>
                    </div>
                  </div>

                  <!-- Tokens Section -->
                  <div class="tokens-section">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h6 class="mb-0">Access Tokens</h6>
                      <span class="badge bg-secondary">{{ partner.accessTokens?.items?.length || 0 }}</span>
                    </div>

                    <div v-if="partner.accessTokens?.items?.length">
                      <div class="token-list" style="max-height: 300px; overflow-y: auto;">
                        <div
                            v-for="token in partner.accessTokens.items"
                            :key="token.id"
                            class="token-card mb-2 p-3 bg-light rounded-2 border border-light"
                            :class="{ 'opacity-50': !token.isActive }"
                        >
                          <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="flex-grow-1 me-2">
                              <code class="text-break small" style="font-size: 0.75rem;">
                                {{ token.showToken ? token.token : maskToken(token.token) }}
                              </code>
                            </div>
                            <div class="d-flex gap-1">
                              <span class="badge" :class="token.isActive ? 'bg-success' : 'bg-secondary'" style="font-size: 0.65rem;">
                                {{ token.isActive ? 'Active' : 'Inactive' }}
                              </span>
                            </div>
                          </div>

                          <div class="d-flex gap-1 flex-wrap">
                            <button
                                @click="toggleTokenVisibility(partner.id, token.id)"
                                class="btn btn-xs btn-ghost"
                                :title="token.showToken ? 'Hide' : 'Show'"
                            >
                              <i :class="token.showToken ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                            </button>
                            <button
                                @click="copyToken(token.token)"
                                class="btn btn-xs btn-ghost"
                                title="Copy"
                            >
                              <i class="bi bi-clipboard"></i>
                            </button>
                            <button
                                @click="toggleTokenStatus(partner.id, token)"
                                class="btn btn-xs btn-ghost"
                                :title="token.isActive ? 'Disable' : 'Enable'"
                            >
                              <i :class="token.isActive ? 'bi bi-toggle-on text-success' : 'bi bi-toggle-off text-secondary'"></i>
                            </button>
                            <button
                                @click="regenerateToken(partner.id, token.id)"
                                class="btn btn-xs btn-ghost text-danger"
                                title="Regenerate"
                            >
                              <i class="bi bi-arrow-clockwise"></i>
                            </button>
                          </div>

                          <small class="text-muted d-block mt-2">
                            Created {{ formatDistanceToNow(token.createdAt) }}
                            • Expires {{ formatDistanceToNow(token.expiresAt) }}
                            <span v-if="isTokenExpired(token.expiresAt)" class="badge bg-danger ms-1" style="font-size: 0.65rem;">
                              Expired
                            </span>
                            <span v-else-if="isTokenExpiringSoon(token.expiresAt)" class="badge bg-warning ms-1" style="font-size: 0.65rem;">
                              Expiring Soon
                            </span>
                          </small>
                        </div>
                      </div>

                      <button
                          @click="generateNewToken(partner.id)"
                          class="btn btn-sm btn-outline-primary w-100 mt-2"
                      >
                        <i class="bi bi-plus me-1"></i>Generate New Token
                      </button>
                    </div>

                    <div v-else class="text-center py-4">
                      <i class="bi bi-key-fill text-muted" style="font-size: 2rem;"></i>
                      <p class="text-muted small mt-2 mb-3">No tokens yet</p>
                      <button
                          @click="generateNewToken(partner.id)"
                          class="btn btn-sm btn-outline-primary"
                      >
                        <i class="bi bi-key me-1"></i>Generate First Token
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Add/Edit Partner Modal -->
    <div class="modal fade" :class="{ 'show d-block': showAddModal }" tabindex="-1" v-if="showAddModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title">{{ isEditing ? 'Edit Partner' : 'Add New Partner' }}</h5>
            <button type="button" class="btn-close" @click="closeModal" :disabled="saving"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="savePartner">
              <div class="mb-3">
                <label for="partnerName" class="form-label fw-500">Partner Name *</label>
                <input
                    type="text"
                    class="form-control"
                    id="partnerName"
                    v-model="currentPartner.name"
                    placeholder="Enter partner name"
                    required
                    :disabled="saving"
                >
              </div>
              <div class="mb-3">
                <label for="partnerEmail" class="form-label fw-500">Email Address *</label>
                <input
                    type="email"
                    class="form-control"
                    id="partnerEmail"
                    v-model="currentPartner.email"
                    placeholder="partner@example.com"
                    required
                    :disabled="saving"
                >
              </div>
              <div class="mb-3">
                <label for="rateLimit" class="form-label fw-500">Rate Limit</label>
                <div class="input-group">
                  <input
                      type="number"
                      class="form-control"
                      id="rateLimit"
                      v-model.number="currentPartner.rateLimit"
                      placeholder="100"
                      min="1"
                      :disabled="saving"
                  >
                  <span class="input-group-text">requests/hour</span>
                </div>
              </div>
              <div class="form-check form-switch mb-3">
                <input
                    type="checkbox"
                    class="form-check-input"
                    id="isActive"
                    v-model="currentPartner.isActive"
                    :disabled="saving"
                >
                <label class="form-check-label" for="isActive">
                  Active Partner
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-light" @click="closeModal" :disabled="saving">
              Cancel
            </button>
            <button
                type="button"
                class="btn btn-primary"
                @click="savePartner"
                :disabled="saving || !isFormValid"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ saving ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Manage Cards Modal -->
    <div class="modal fade" :class="{ 'show d-block': showCardsModal }" tabindex="-1" v-if="showCardsModal">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title">Manage Cards for {{ currentPartner.name }}</h5>
            <button type="button" class="btn-close" @click="closeCardsModal" :disabled="saving"></button>
          </div>
          <div class="modal-body">
            <!-- Available Cards -->
            <div class="mb-4">
              <h6 class="mb-3">Available Cards</h6>
              <div v-if="availableCards.length === 0" class="text-center py-3 bg-light rounded">
                <p class="text-muted mb-0">No cards available</p>
              </div>
              <div v-else class="row g-2">
                <div
                    v-for="card in availableCards"
                    :key="card.id"
                    class="col-md-6"
                >
                  <div class="card available-card border p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div class="flex-grow-1">
                        <h6 class="mb-1">{{ card.name }}</h6>
                        <p class="text-muted small mb-1">{{ card.type }}</p>
                      </div>
                      <span class="badge" :class="card.isActive ? 'bg-success' : 'bg-secondary'">
                        ${{ card.price }}
                      </span>
                    </div>
                    <p class="small text-muted mb-2">{{ card.description }}</p>
                    <div class="d-flex justify-content-between align-items-center">
                      <small class="text-muted" :class="{ 'text-danger': !card.isActive }">
                        {{ card.isActive ? 'Active' : 'Inactive' }}
                      </small>
                      <button
                          @click="assignCardToPartner(card)"
                          class="btn btn-sm btn-outline-primary"
                          :disabled="!card.isActive || isCardAssigned(card.id)"
                      >
                        <i class="bi bi-plus me-1"></i>
                        {{ isCardAssigned(card.id) ? 'Assigned' : 'Assign' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Assigned Cards -->
            <div>
              <h6 class="mb-3">Assigned Cards</h6>
              <div v-if="!currentPartner.contractorCards?.items?.length" class="text-center py-3 bg-light rounded">
                <p class="text-muted mb-0">No cards assigned yet</p>
              </div>
              <div v-else class="assigned-cards-list">
                <div
                    v-for="contractorCard in currentPartner.contractorCards.items"
                    :key="contractorCard.id"
                    class="card assigned-card-item border mb-2 p-3"
                >
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="mb-1">{{ contractorCard.card?.name }}</h6>
                      <p class="text-muted small mb-0">{{ contractorCard.card?.type }}</p>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                      <div class="input-group input-group-sm" style="width: 120px;">
                        <input
                            type="number"
                            class="form-control"
                            v-model.number="contractorCard.discountPercent"
                            min="0"
                            max="100"
                            step="0.1"
                            @change="updateCardDiscount(contractorCard.id, contractorCard.discountPercent)"
                        >
                        <span class="input-group-text">%</span>
                      </div>
                      <button
                          @click="removeCardAssignment(currentPartner.id, contractorCard.id)"
                          class="btn btn-sm btn-outline-danger"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-light" @click="closeCardsModal" :disabled="saving">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div v-if="showAddModal || showCardsModal" class="modal-backdrop fade show"></div>

    <!-- Toast Notifications -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast show align-items-center border-0 shadow-sm"
          :class="`bg-${toast.type}`"
          role="alert"
      >
        <div class="d-flex text-white">
          <div class="toast-body">
            <i :class="`bi bi-${toast.icon} me-2`"></i>{{ toast.message }}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="removeToast(toast.id)"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { generateClient } from 'aws-amplify/api'
import { handleSignOut } from '../utils/auth'
import { generateAccessToken } from '../utils/tokenGenerator'
import AppHeader from "@/components/AppHeader.vue"

// Generate GraphQL client
const client = generateClient()

// Reactive data
const partners = ref<Array<any>>([])
const availableCards = ref<Array<any>>([])
const loading = ref(false)
const saving = ref(false)
const showAddModal = ref(false)
const showCardsModal = ref(false)
const isEditing = ref(false)

// Current partner for form
const currentPartner = reactive({
  id: '',
  name: '',
  email: '',
  rateLimit: 100,
  isActive: true
})

// Toast notifications
const toasts = ref<Array<{id: string, message: string, type: string, icon: string}>>([])

// Computed properties
const isFormValid = computed(() => currentPartner.name.trim() && currentPartner.email.trim())

const totalTokenCount = computed(() =>
    partners.value.reduce((sum, p) => sum + (p.accessTokens?.items?.length || 0), 0)
)

const activeTokenCount = computed(() =>
    partners.value.reduce((sum, p) =>
        sum + (p.accessTokens?.items?.filter(t => t.isActive).length || 0), 0
    )
)

const totalCardAssignments = computed(() =>
    partners.value.reduce((sum, p) => sum + (p.contractorCards?.items?.length || 0), 0)
)

// GraphQL Queries
const listContractorsQuery = `
  query ListContractors {
    listContractors {
      items {
        id
        name
        email
        rateLimit
        isActive
        createdAt
        updatedAt
        accessTokens {
          items {
            id
            token
            expiresAt
            isActive
            createdAt
            contractorId
          }
        }
        contractorCards {
          items {
            id
            discountPercent
            cardId
            contractorId
            card {
              id
              name
              price
              type
              description
              isActive
            }
          }
        }
      }
    }
  }
`

const listCardsQuery = `
  query ListCards {
    listCards {
      items {
        id
        name
        price
        type
        description
        isActive
      }
    }
  }
`

// Load partners using GraphQL
const loadPartners = async () => {
  loading.value = true
  try {
    const response = await client.graphql({
      query: listContractorsQuery
    })

    if (response.data?.listContractors?.items) {
      partners.value = response.data.listContractors.items.map((contractor: any) => ({
        ...contractor,
        accessTokens: {
          items: (contractor.accessTokens?.items || []).map((token: any) => ({
            ...token,
            showToken: false
          }))
        }
      }))
    }
  } catch (error) {
    console.error('Error loading partners:', error)
    showToast('Failed to load partners', 'danger', 'exclamation-triangle')
  } finally {
    loading.value = false
  }
}

// Load available cards
const loadAvailableCards = async () => {
  try {
    const response = await client.graphql({
      query: listCardsQuery
    })

    if (response.data?.listCards?.items) {
      availableCards.value = response.data.listCards.items
    }
  } catch (error) {
    console.error('Error loading cards:', error)
    showToast('Failed to load cards', 'danger', 'exclamation-triangle')
  }
}

// Check if card is already assigned to partner
const isCardAssigned = (cardId: string) => {
  if (!currentPartner.contractorCards?.items) return false
  return currentPartner.contractorCards.items.some((cc: any) => cc.cardId === cardId)
}

// Manage cards for partner
const manageCards = (partner: any) => {
  currentPartner.id = partner.id
  currentPartner.name = partner.name
  currentPartner.email = partner.email
  currentPartner.rateLimit = partner.rateLimit
  currentPartner.isActive = partner.isActive

  // Set the contractorCards from the partner
  const partnerData = partners.value.find(p => p.id === partner.id)
  if (partnerData) {
    currentPartner.contractorCards = partnerData.contractorCards
  }

  showCardsModal.value = true
}

// Assign card to partner
const assignCardToPartner = async (card: any) => {
  if (!currentPartner.id) return

  try {
    await client.models.ContractorCard.create({
      cardId: card.id,
      contractorId: currentPartner.id,
      discountPercent: 10.0 // Default discount
    })

    showToast(`Card "${card.name}" assigned successfully`, 'success', 'check-circle')
    await loadPartners()

    // Refresh the current partner data in the modal
    const partnerData = partners.value.find(p => p.id === currentPartner.id)
    if (partnerData) {
      currentPartner.contractorCards = partnerData.contractorCards
    }
  } catch (error) {
    console.error('Error assigning card:', error)
    showToast('Failed to assign card', 'danger', 'exclamation-triangle')
  }
}

// Remove card assignment
const removeCardAssignment = async (contractorId: string, contractorCardId: string) => {
  if (!confirm('Remove this card assignment?')) return

  try {
    await client.models.ContractorCard.delete({ id: contractorCardId })
    showToast('Card assignment removed', 'success', 'check-circle')
    await loadPartners()

    // Refresh the current partner data in the modal if open
    if (showCardsModal.value) {
      const partnerData = partners.value.find(p => p.id === contractorId)
      if (partnerData) {
        currentPartner.contractorCards = partnerData.contractorCards
      }
    }
  } catch (error) {
    console.error('Error removing card assignment:', error)
    showToast('Failed to remove card assignment', 'danger', 'exclamation-triangle')
  }
}

// Update card discount
const updateCardDiscount = async (contractorCardId: string, discountPercent: number) => {
  try {
    await client.models.ContractorCard.update({
      id: contractorCardId,
      discountPercent: discountPercent
    })
    showToast('Discount updated successfully', 'success', 'check-circle')
  } catch (error) {
    console.error('Error updating discount:', error)
    showToast('Failed to update discount', 'danger', 'exclamation-triangle')
  }
}

// Save partner using Amplify Gen 2
const savePartner = async () => {
  if (!isFormValid.value) return

  saving.value = true
  try {
    if (isEditing.value) {
      await client.graphql({
        query: `mutation UpdateContractor($input: UpdateContractorInput!) {
          updateContractor(input: $input) {
            id name email rateLimit isActive
          }
        }`,
        variables: {
          input: {
            id: currentPartner.id,
            name: currentPartner.name,
            email: currentPartner.email,
            rateLimit: currentPartner.rateLimit,
            isActive: currentPartner.isActive
          }
        }
      })
      showToast('Partner updated successfully', 'success', 'check-circle')
    } else {
      await client.graphql({
        query: `mutation CreateContractor($input: CreateContractorInput!) {
          createContractor(input: $input) {
            id name email rateLimit isActive
          }
        }`,
        variables: {
          input: {
            name: currentPartner.name,
            email: currentPartner.email,
            rateLimit: currentPartner.rateLimit,
            isActive: currentPartner.isActive
          }
        }
      })
      showToast('Partner created successfully', 'success', 'check-circle')
    }

    closeModal()
    await loadPartners()
  } catch (error) {
    console.error('Error saving partner:', error)
    showToast('Failed to save partner', 'danger', 'exclamation-triangle')
  } finally {
    saving.value = false
  }
}

// Generate new token
const generateNewToken = async (contractorId: string) => {
  try {
    const contractor = partners.value.find(p => p.id === contractorId)
    if (!contractor) return

    const newToken = generateAccessToken(contractor.name)
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    await client.models.ContractorToken.create({
      token: newToken,
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      contractorId: contractorId
    })

    showToast('Token generated successfully', 'success', 'key')
    await loadPartners()
  } catch (error) {
    console.error('Error generating token:', error)
    showToast('Failed to generate token', 'danger', 'exclamation-triangle')
  }
}

// Toggle token status
const toggleTokenStatus = async (contractorId: string, token: any) => {
  try {
    await client.models.ContractorToken.update({
      id: token.id,
      isActive: !token.isActive
    })

    const message = !token.isActive ? 'Token enabled' : 'Token disabled'
    showToast(`${message} successfully`, 'success', 'check-circle')
    await loadPartners()
  } catch (error) {
    console.error('Error toggling token:', error)
    showToast('Failed to update token', 'danger', 'exclamation-triangle')
  }
}

// Regenerate token
const regenerateToken = async (contractorId: string, tokenId: string) => {
  if (!confirm('Regenerate this token? Existing integrations will stop working.')) return

  try {
    await client.models.ContractorToken.update({
      id: tokenId,
      isActive: false
    })
    await generateNewToken(contractorId)
  } catch (error) {
    console.error('Error regenerating token:', error)
    showToast('Failed to regenerate token', 'danger', 'exclamation-triangle')
  }
}

// Toggle partner status
const togglePartnerStatus = async (partner: any) => {
  try {
    await client.models.Contractor.update({
      id: partner.id,
      isActive: !partner.isActive
    })
    showToast(`Partner ${!partner.isActive ? 'activated' : 'deactivated'}`, 'success', 'check-circle')
    await loadPartners()
  } catch (error) {
    console.error('Error updating partner:', error)
    showToast('Failed to update partner', 'danger', 'exclamation-triangle')
  }
}

// Edit partner
const editPartner = (partner: any) => {
  isEditing.value = true
  currentPartner.id = partner.id
  currentPartner.name = partner.name
  currentPartner.email = partner.email
  currentPartner.rateLimit = partner.rateLimit
  currentPartner.isActive = partner.isActive
  showAddModal.value = true
}

// Delete partner
const deletePartner = async (partnerId: string) => {
  if (!confirm('Delete this partner and all their tokens and card assignments?')) return

  try {
    const contractor = partners.value.find(p => p.id === partnerId)

    // Delete card assignments
    if (contractor?.contractorCards?.items) {
      for (const card of contractor.contractorCards.items) {
        await client.models.ContractorCard.delete({ id: card.id })
      }
    }

    // Delete tokens
    if (contractor?.accessTokens?.items) {
      for (const token of contractor.accessTokens.items) {
        await client.models.ContractorToken.delete({ id: token.id })
      }
    }

    await client.models.Contractor.delete({ id: partnerId })
    showToast('Partner deleted successfully', 'success', 'check-circle')
    await loadPartners()
  } catch (error) {
    console.error('Error deleting partner:', error)
    showToast('Failed to delete partner', 'danger', 'exclamation-triangle')
  }
}

// UI Helpers
const toggleTokenVisibility = (partnerId: string, tokenId: string) => {
  const partner = partners.value.find(p => p.id === partnerId)
  if (partner?.accessTokens?.items) {
    const token = partner.accessTokens.items.find(t => t.id === tokenId)
    if (token) token.showToken = !token.showToken
  }
}

const maskToken = (token: string) => {
  if (token.length <= 8) return '•'.repeat(token.length)
  const start = token.substring(0, 4)
  const end = token.substring(token.length - 4)
  return `${start}${'•'.repeat(token.length - 8)}${end}`
}

const copyToken = async (token: string) => {
  try {
    await navigator.clipboard.writeText(token)
    showToast('Copied to clipboard!', 'success', 'clipboard-check')
  } catch (err) {
    showToast('Failed to copy', 'danger', 'exclamation-triangle')
  }
}

const formatDate = (date: string | Date | null) => {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDistanceToNow = (date: string | Date | null) => {
  if (!date) return 'never'
  const now = new Date()
  const past = new Date(date)
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const isTokenExpired = (expiresAt: string | Date) => {
  return new Date(expiresAt) < new Date()
}

const isTokenExpiringSoon = (expiresAt: string | Date) => {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  return new Date(expiresAt) < thirtyDaysFromNow
}

const closeModal = () => {
  showAddModal.value = false
  isEditing.value = false
  currentPartner.id = ''
  currentPartner.name = ''
  currentPartner.email = ''
  currentPartner.rateLimit = 100
  currentPartner.isActive = true
  saving.value = false
}

const closeCardsModal = () => {
  showCardsModal.value = false
  currentPartner.id = ''
  currentPartner.name = ''
  currentPartner.email = ''
  currentPartner.rateLimit = 100
  currentPartner.isActive = true
  saving.value = false
}

const showToast = (message: string, type: string = 'info', icon: string = 'info-circle') => {
  const id = Date.now().toString()
  toasts.value.push({ id, message, type, icon })
  setTimeout(() => removeToast(id), 5000)
}

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) toasts.value.splice(index, 1)
}

onMounted(async () => {
  await loadPartners()
  await loadAvailableCards()
})
</script>

<style scoped>
.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-ghost {
  background: none;
  border: none;
  color: #6c757d;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-ghost:hover {
  color: #495057;
}

.token-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

.token-list::-webkit-scrollbar {
  width: 6px;
}

.token-list::-webkit-scrollbar-track {
  background: transparent;
}

.token-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.token-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.assigned-card {
  transition: all 0.2s ease;
}

.assigned-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.available-card {
  transition: all 0.2s ease;
}

.available-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
</style>