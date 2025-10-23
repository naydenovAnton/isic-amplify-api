<!-- views/Cards.vue -->
<template>
  <div class="cards">
    <AppHeader title="Cards" @sign-out="handleSignOut"/>

    <main class="cards-content p-4">
      <div class="container-fluid">
        <!-- Header Section -->
        <div class="mb-5">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 class="h3 mb-1 fw-bold">Card Management</h1>
              <p class="text-muted mb-0">{{ cards.length }} card{{ cards.length !== 1 ? 's' : '' }}</p>
            </div>
            <button
                @click="showAddModal = true"
                class="btn btn-primary"
                :disabled="loading"
            >
              <i class="bi bi-plus-circle me-2"></i>
              {{ loading ? 'Loading...' : 'Add Card' }}
            </button>
          </div>

          <!-- Stats Row -->
          <div class="row g-3">
            <div class="col-md-3">
              <div class="card border bg-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <p class="text-muted small mb-1">Total Cards</p>
                      <h5 class="mb-0">{{ cards.length }}</h5>
                    </div>
                    <i class="bi bi-credit-card-fill text-primary" style="font-size: 1.5rem;"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card border bg-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <p class="text-muted small mb-1">Active Cards</p>
                      <h5 class="mb-0">{{ cards.filter(c => c.isActive).length }}</h5>
                    </div>
                    <i class="bi bi-check-circle-fill text-success" style="font-size: 1.5rem;"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card border bg-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <p class="text-muted small mb-1">Total Price</p>
                      <h5 class="mb-0">${{ totalPrice.toFixed(2) }}</h5>
                    </div>
                    <i class="bi bi-cash-circle text-warning" style="font-size: 1.5rem;"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card border bg-white">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <p class="text-muted small mb-1">Total Fields</p>
                      <h5 class="mb-0">{{ totalRequiredFields }}</h5>
                    </div>
                    <i class="bi bi-list-check text-info" style="font-size: 1.5rem;"></i>
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
          <p class="text-muted">Loading cards...</p>
        </div>

        <!-- Cards List -->
        <div v-else>
          <div v-if="cards.length === 0" class="card border-0 bg-light">
            <div class="card-body text-center py-5">
              <i class="bi bi-inbox display-4 text-muted mb-3 d-block"></i>
              <h5 class="text-muted mb-2">No cards yet</h5>
              <p class="text-muted mb-4">Get started by adding your first card</p>
              <button @click="showAddModal = true" class="btn btn-primary">
                <i class="bi bi-plus-circle me-2"></i>Add First Card
              </button>
            </div>
          </div>

          <div v-else class="row g-3">
            <div
                v-for="card in cards"
                :key="card.id"
                class="col-12"
            >
              <div class="card border h-100" :class="{ 'opacity-75': !card.isActive }">
                <!-- Card Header -->
                <div class="card-header border-0 border-bottom pb-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                      <h5 class="card-title mb-2">{{ card.name }}</h5>
                      <div class="d-flex gap-2 flex-wrap mb-2">
                        <span class="badge" :class="card.isActive ? 'bg-success' : 'bg-secondary'">
                          {{ card.isActive ? 'Active' : 'Inactive' }}
                        </span>
                        <span class="badge bg-info">
                          <i class="bi bi-tag me-1"></i>{{ card.type }}
                        </span>
                        <span class="badge bg-warning text-dark">
                          <i class="bi bi-cash me-1"></i>${{ card.price }}
                        </span>
                      </div>
                      <p v-if="card.description" class="text-muted small mb-0">{{ card.description }}</p>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                      <button
                          @click="editCard(card)"
                          class="btn btn-sm btn-outline-secondary"
                          title="Edit card"
                      >
                        <i class="bi bi-pencil me-1"></i>Edit
                      </button>
                      <button
                          @click="toggleCardStatus(card)"
                          class="btn btn-sm"
                          :class="card.isActive ? 'btn-outline-warning' : 'btn-outline-success'"
                          :title="card.isActive ? 'Deactivate' : 'Activate'"
                      >
                        <i :class="card.isActive ? 'bi bi-pause me-1' : 'bi bi-play me-1'"></i>
                        {{ card.isActive ? 'Pause' : 'Resume' }}
                      </button>
                      <button
                          @click="deleteCard(card.id)"
                          class="btn btn-sm btn-outline-danger"
                          title="Delete card"
                      >
                        <i class="bi bi-trash me-1"></i>Delete
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Card Body -->
                <div class="card-body">
                  <!-- Required Fields Section -->
                  <div class="required-fields-section">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h6 class="mb-0">Required Fields</h6>
                      <span class="badge bg-secondary">{{ card.requiredFields?.items?.length || 0 }}</span>
                    </div>

                    <div v-if="card.requiredFields?.items?.length">
                      <div class="fields-list" style="max-height: 400px; overflow-y: auto;">
                        <div
                            v-for="field in getSortedFields(card.requiredFields.items)"
                            :key="field.id"
                            class="field-card mb-2 p-3 bg-light rounded-2 border border-light"
                        >
                          <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="flex-grow-1">
                              <h6 class="mb-1">{{ field.label || field.fieldName }}</h6>
                              <code class="text-muted small">{{ field.fieldName }}</code>
                            </div>
                            <div class="d-flex gap-1">
                              <span class="badge bg-primary" style="font-size: 0.65rem;">
                                {{ field.fieldType }}
                              </span>
                              <span v-if="field.isRequired" class="badge bg-danger" style="font-size: 0.65rem;">
                                Required
                              </span>
                            </div>
                          </div>

                          <div v-if="field.placeholder" class="small text-muted mb-2">
                            <i class="bi bi-chat-quote me-1"></i>{{ field.placeholder }}
                          </div>

                          <div class="d-flex gap-1 flex-wrap">
                            <button
                                @click="editField(card.id, field)"
                                class="btn btn-xs btn-ghost"
                                title="Edit field"
                            >
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button
                                @click="deleteField(card.id, field.id)"
                                class="btn btn-xs btn-ghost text-danger"
                                title="Delete field"
                            >
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                          @click="showFieldModalFunc(card.id)"
                          class="btn btn-sm btn-outline-primary w-100 mt-2"
                      >
                        <i class="bi bi-plus me-1"></i>Add Field
                      </button>
                    </div>

                    <div v-else class="text-center py-4">
                      <i class="bi bi-list-check text-muted" style="font-size: 2rem;"></i>
                      <p class="text-muted small mt-2 mb-3">No required fields yet</p>
                      <button
                          @click="showFieldModalFunc(card.id)"
                          class="btn btn-sm btn-outline-primary"
                      >
                        <i class="bi bi-plus me-1"></i>Add First Field
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

    <!-- Add/Edit Card Modal -->
    <div class="modal fade" :class="{ 'show d-block': showAddModal }" tabindex="-1" v-if="showAddModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title">{{ isEditing ? 'Edit Card' : 'Add New Card' }}</h5>
            <button type="button" class="btn-close" @click="closeModal" :disabled="saving"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveCard">
              <div class="mb-3">
                <label for="cardName" class="form-label fw-500">Card Name *</label>
                <input
                    type="text"
                    class="form-control"
                    id="cardName"
                    v-model="currentCard.name"
                    placeholder="Enter card name"
                    required
                    :disabled="saving"
                >
              </div>
              <div class="mb-3">
                <label for="cardType" class="form-label fw-500">Card Type *</label>
                <input
                    type="text"
                    class="form-control"
                    id="cardType"
                    v-model="currentCard.type"
                    placeholder="e.g., Premium, Standard"
                    required
                    :disabled="saving"
                >
              </div>
              <div class="mb-3">
                <label for="cardPrice" class="form-label fw-500">Price *</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input
                      type="number"
                      class="form-control"
                      id="cardPrice"
                      v-model.number="currentCard.price"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                      :disabled="saving"
                  >
                </div>
              </div>
              <div class="mb-3">
                <label for="cardDescription" class="form-label fw-500">Description</label>
                <textarea
                    class="form-control"
                    id="cardDescription"
                    v-model="currentCard.description"
                    placeholder="Enter card description"
                    rows="3"
                    :disabled="saving"
                ></textarea>
              </div>
              <div class="form-check form-switch mb-3">
                <input
                    type="checkbox"
                    class="form-check-input"
                    id="isActive"
                    v-model="currentCard.isActive"
                    :disabled="saving"
                >
                <label class="form-check-label" for="isActive">
                  Active Card
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
                @click="saveCard"
                :disabled="saving || !isCardFormValid"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ saving ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Field Modal -->
    <div class="modal fade" :class="{ 'show d-block': showFieldModal }" tabindex="-1" v-if="showFieldModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title">{{ editingField ? 'Edit Field' : 'Add New Field' }}</h5>
            <button type="button" class="btn-close" @click="closeFieldModal" :disabled="saving"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveField">
              <div class="mb-3">
                <label for="fieldName" class="form-label fw-500">Field Name *</label>
                <input
                    type="text"
                    class="form-control"
                    id="fieldName"
                    v-model="currentField.fieldName"
                    placeholder="e.g., cardNumber"
                    required
                    :disabled="saving"
                >
              </div>
              <div class="mb-3">
                <label for="fieldLabel" class="form-label fw-500">Field Label</label>
                <input
                    type="text"
                    class="form-control"
                    id="fieldLabel"
                    v-model="currentField.label"
                    placeholder="e.g., Card Number"
                    :disabled="saving"
                >
              </div>
              <div class="mb-3">
                <label for="fieldType" class="form-label fw-500">Field Type *</label>
                <select
                    class="form-select"
                    id="fieldType"
                    v-model="currentField.fieldType"
                    required
                    :disabled="saving"
                >
                  <option value="">Select type</option>
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                  <option value="file">File</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="placeholder" class="form-label fw-500">Placeholder</label>
                <input
                    type="text"
                    class="form-control"
                    id="placeholder"
                    v-model="currentField.placeholder"
                    placeholder="e.g., Enter card number"
                    :disabled="saving"
                >
              </div>
              <div class="mb-3">
                <label for="order" class="form-label fw-500">Display Order</label>
                <input
                    type="number"
                    class="form-control"
                    id="order"
                    v-model.number="currentField.order"
                    placeholder="0"
                    min="0"
                    :disabled="saving"
                >
              </div>
              <div class="mb-3">
                <label for="validationRegex" class="form-label fw-500">Validation Regex</label>
                <input
                    type="text"
                    class="form-control"
                    id="validationRegex"
                    v-model="currentField.validationRegex"
                    placeholder="e.g., ^\d{16}$"
                    :disabled="saving"
                >
              </div>
              <div class="form-check mb-3">
                <input
                    type="checkbox"
                    class="form-check-input"
                    id="isRequired"
                    v-model="currentField.isRequired"
                    :disabled="saving"
                >
                <label class="form-check-label" for="isRequired">
                  Required Field
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-light" @click="closeFieldModal" :disabled="saving">
              Cancel
            </button>
            <button
                type="button"
                class="btn btn-primary"
                @click="saveField"
                :disabled="saving || !isFieldFormValid"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ saving ? 'Saving...' : (editingField ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div v-if="showAddModal || showFieldModal" class="modal-backdrop fade show"></div>

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
import {ref, reactive, computed, onMounted} from 'vue'
import {generateClient} from 'aws-amplify/api'
import {handleSignOut} from '../utils/auth'
import AppHeader from "@/components/AppHeader.vue"

// Generate GraphQL client
const client = generateClient()

// Reactive data
const cards = ref<Array<Schema['Card']['type'] & {
  requiredFields?: { items: Schema['CardRequiredField']['type'][] }
}>>([])
const loading = ref(false)
const saving = ref(false)
const showAddModal = ref(false)
const showFieldModal = ref(false)
const isEditing = ref(false)
const editingField = ref(false)
const currentCardId = ref('')

// Current card for form
const currentCard = reactive({
  id: '',
  name: '',
  type: '',
  price: 0,
  description: '',
  isActive: true
})

// Current field for form
const currentField = reactive({
  id: '',
  fieldName: '',
  label: '',
  fieldType: '',
  placeholder: '',
  validationRegex: '',
  order: 0,
  isRequired: true
})

// Toast notifications
const toasts = ref<Array<{ id: string, message: string, type: string, icon: string }>>([])

// Computed properties
const isCardFormValid = computed(() =>
    currentCard.name.trim() && currentCard.type.trim() && currentCard.price !== null
)

const isFieldFormValid = computed(() =>
    currentField.fieldName.trim() && currentField.fieldType
)

const totalPrice = computed(() =>
    cards.value.reduce((sum, c) => sum + c.price, 0)
)

const totalRequiredFields = computed(() =>
    cards.value.reduce((sum, c) => sum + (c.requiredFields?.items?.length || 0), 0)
)

const listCardsQuery = `
  query ListCards {
    listCards {
      items {
        id
        name
        type
        price
        description
        isActive
        createdAt
        updatedAt
        requiredFields {
          items {
            id
            cardId
            fieldName
            fieldType
            label
            placeholder
            validationRegex
            isRequired
            order
            createdAt
          }
        }
      }
    }
  }
`

// Load cards using GraphQL
const loadCards = async () => {
  loading.value = true
  try {
    const response = await client.graphql({
      query: listCardsQuery
    })

    if (response.data?.listCards?.items) {
      cards.value = response.data.listCards.items
    }
  } catch (error) {
    console.error('Error loading cards:', error)
    showToast('Failed to load cards', 'danger', 'exclamation-triangle')
  } finally {
    loading.value = false
  }
}

// Save card
const saveCard = async () => {
  if (!isCardFormValid.value) return

  saving.value = true
  try {
    if (isEditing.value) {
      await client.graphql({
        query: `mutation UpdateCard($input: UpdateCardInput!) {
          updateCard(input: $input) {
            id name type price description isActive
          }
        }`,
        variables: {
          input: {
            id: currentCard.id,
            name: currentCard.name,
            type: currentCard.type,
            price: currentCard.price,
            description: currentCard.description,
            isActive: currentCard.isActive
          }
        }
      })
      showToast('Card updated successfully', 'success', 'check-circle')
    } else {
      await client.graphql({
        query: `mutation CreateCard($input: CreateCardInput!) {
          createCard(input: $input) {
            id name type price description isActive
          }
        }`,
        variables: {
          input: {
            name: currentCard.name,
            type: currentCard.type,
            price: currentCard.price,
            description: currentCard.description,
            isActive: currentCard.isActive
          }
        }
      })
      showToast('Card created successfully', 'success', 'check-circle')
    }

    closeModal()
    await loadCards()
  } catch (error) {
    console.error('Error saving card:', error)
    showToast('Failed to save card', 'danger', 'exclamation-triangle')
  } finally {
    saving.value = false
  }
}

// Save field
const saveField = async () => {
  if (!isFieldFormValid.value) return

  saving.value = true
  try {
    if (editingField.value) {
      await client.models.CardRequiredField.update({
        id: currentField.id,
        fieldName: currentField.fieldName,
        label: currentField.label,
        fieldType: currentField.fieldType,
        placeholder: currentField.placeholder,
        validationRegex: currentField.validationRegex,
        order: currentField.order,
        isRequired: currentField.isRequired
      })
      showToast('Field updated successfully', 'success', 'check-circle')
    } else {
      await client.models.CardRequiredField.create({
        cardId: currentCardId.value,
        fieldName: currentField.fieldName,
        label: currentField.label,
        fieldType: currentField.fieldType,
        placeholder: currentField.placeholder,
        validationRegex: currentField.validationRegex,
        order: currentField.order,
        isRequired: currentField.isRequired
      })
      showToast('Field created successfully', 'success', 'check-circle')
    }

    closeFieldModal()
    await loadCards()
  } catch (error) {
    console.error('Error saving field:', error)
    showToast('Failed to save field', 'danger', 'exclamation-triangle')
  } finally {
    saving.value = false
  }
}

// Toggle card status
const toggleCardStatus = async (card: any) => {
  try {
    await client.models.Card.update({
      id: card.id,
      isActive: !card.isActive
    })
    showToast(`Card ${!card.isActive ? 'activated' : 'deactivated'}`, 'success', 'check-circle')
    await loadCards()
  } catch (error) {
    console.error('Error updating card:', error)
    showToast('Failed to update card', 'danger', 'exclamation-triangle')
  }
}

// Edit card
const editCard = (card: any) => {
  isEditing.value = true
  currentCard.id = card.id
  currentCard.name = card.name
  currentCard.type = card.type
  currentCard.price = card.price
  currentCard.description = card.description || ''
  currentCard.isActive = card.isActive
  showAddModal.value = true
}

// Delete card
const deleteCard = async (cardId: string) => {
  if (!confirm('Delete this card and all its fields?')) return

  try {
    const card = cards.value.find(c => c.id === cardId)
    if (card?.requiredFields?.items) {
      for (const field of card.requiredFields.items) {
        await client.models.CardRequiredField.delete({id: field.id})
      }
    }

    await client.models.Card.delete({id: cardId})
    showToast('Card deleted successfully', 'success', 'check-circle')
    await loadCards()
  } catch (error) {
    console.error('Error deleting card:', error)
    showToast('Failed to delete card', 'danger', 'exclamation-triangle')
  }
}

// Edit field
const editField = (cardId: string, field: any) => {
  editingField.value = true
  currentCardId.value = cardId
  currentField.id = field.id
  currentField.fieldName = field.fieldName
  currentField.label = field.label || ''
  currentField.fieldType = field.fieldType
  currentField.placeholder = field.placeholder || ''
  currentField.validationRegex = field.validationRegex || ''
  currentField.order = field.order || 0
  currentField.isRequired = field.isRequired
  showFieldModal.value = true
}

// Delete field
const deleteField = async (cardId: string, fieldId: string) => {
  if (!confirm('Delete this field?')) return

  try {
    await client.models.CardRequiredField.delete({id: fieldId})
    showToast('Field deleted successfully', 'success', 'check-circle')
    await loadCards()
  } catch (error) {
    console.error('Error deleting field:', error)
    showToast('Failed to delete field', 'danger', 'exclamation-triangle')
  }
}

// Show field modal
const showFieldModalFunc = (cardId: string) => {
  currentCardId.value = cardId
  editingField.value = false
  resetField()
  showFieldModal.value = true
}

// Get sorted fields
const getSortedFields = (fields: any[]) => {
  return [...fields].sort((a, b) => (a.order || 0) - (b.order || 0))
}

// Close modals
const closeModal = () => {
  showAddModal.value = false
  isEditing.value = false
  currentCard.id = ''
  currentCard.name = ''
  currentCard.type = ''
  currentCard.price = 0
  currentCard.description = ''
  currentCard.isActive = true
  saving.value = false
}

const closeFieldModal = () => {
  showFieldModal.value = false
  editingField.value = false
  resetField()
  saving.value = false
}

const resetField = () => {
  currentField.id = ''
  currentField.fieldName = ''
  currentField.label = ''
  currentField.fieldType = ''
  currentField.placeholder = ''
  currentField.validationRegex = ''
  currentField.order = 0
  currentField.isRequired = true
}

// Toast helpers
const showToast = (message: string, type: string = 'info', icon: string = 'info-circle') => {
  const id = Date.now().toString()
  toasts.value.push({id, message, type, icon})
  setTimeout(() => removeToast(id), 5000)
}

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) toasts.value.splice(index, 1)
}

onMounted(() => loadCards())
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

.fields-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
}

</style>