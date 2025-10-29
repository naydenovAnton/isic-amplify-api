<template>
  <div class="fields">
    <AppHeader title="Input Fields" @sign-out="handleSignOut" />

    <main class="fields-content p-4">
      <div class="container-fluid">
        <!-- Header -->
        <div class="mb-5">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 class="h3 mb-1 fw-bold">Field Management</h1>
              <p class="text-muted mb-0">{{ fields.length }} field{{ fields.length !== 1 ? 's' : '' }}</p>
            </div>
            <button class="btn btn-primary" @click="openFieldModal" :disabled="loading">
              <i class="bi bi-plus-circle me-2"></i>{{ loading ? 'Loading…' : 'Add Field' }}
            </button>
          </div>

          <!-- Stats -->
          <div class="row g-3">
            <div class="col-md-3" v-for="s in stats" :key="s.label">
              <div class="card border bg-white">
                <div class="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <p class="text-muted small mb-1">{{ s.label }}</p>
                    <h5 class="mb-0">{{ s.value }}</h5>
                  </div>
                  <i :class="s.icon" :style="{ fontSize: '1.5rem', color: s.color }"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary mb-3" />
          <p class="text-muted">Loading fields…</p>
        </div>

        <!-- Empty -->
        <div v-else-if="!fields.length" class="card border-0 bg-light text-center py-5">
          <i class="bi bi-inbox display-4 text-muted mb-3" />
          <h5 class="text-muted mb-2">No fields yet</h5>
          <p class="text-muted mb-3">Create your first reusable input field</p>
          <button class="btn btn-primary" @click="openFieldModal">
            <i class="bi bi-plus-circle me-1"></i>Add First Field
          </button>
        </div>

        <!-- List -->
        <div v-else class="row g-3">
          <div v-for="field in fields" :key="field.id" class="col-12">
            <div class="card border h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <h5 class="mb-1">{{ field.fieldName }}</h5>
                    <code class="small text-muted">{{ field.fieldType }}</code>
                    <div class="mt-2">
                      <span class="badge bg-info me-1">{{ field.fieldType }}</span>
                      <span v-if="field.validationRegex" class="badge bg-secondary">Regex</span>
                    </div>
                  </div>
                  <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-secondary" @click="editField(field)">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteField(field.id)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>

                <!-- Select options -->
                <div v-if="field.fieldType === 'select'" class="mt-3">
                  <h6 class="fw-semibold small text-muted mb-2">Options</h6>
                  <ul v-if="field.options?.length" class="list-group small">
                    <li
                        v-for="opt in sortOptions(field.options)"
                        :key="opt.id"
                        class="list-group-item d-flex justify-content-between align-items-center py-2"
                    >
                      <span>
                        {{ opt.label }}
                        <code class="text-muted">({{ opt.value }})</code>
                        <!-- Only per-card price exists now -->
                        <span
                            v-if="opt.cardPrice != null"
                            class="text-warning ms-2"
                        >
                          (Card: ${{ opt.cardPrice.toFixed(2) }})
                        </span>
                      </span>
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" @click="editOption(field.id, opt)">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" @click="deleteOption(opt.id)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </li>
                  </ul>
                  <div v-else class="text-muted small mb-2">No options yet</div>
                  <button class="btn btn-sm btn-outline-primary w-100 mt-2" @click="openOptionModal(field.id)">
                    <i class="bi bi-plus me-1"></i>Add Option
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Field Modal -->
    <div class="modal fade" :class="{ 'show d-block': showFieldModal }" tabindex="-1" v-if="showFieldModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title">{{ editingField ? 'Edit Field' : 'Add Field' }}</h5>
            <button class="btn-close" @click="closeFieldModal" />
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveField">
              <div class="mb-3">
                <label class="form-label">Field Name *</label>
                <input class="form-control" v-model="currentField.fieldName" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Type *</label>
                <select class="form-select" v-model="currentField.fieldType" required>
                  <option value="">Select type</option>
                  <option v-for="t in fieldTypes" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Validation Regex</label>
                <input class="form-control" v-model="currentField.validationRegex" placeholder="e.g. ^\\d+$" />
              </div>
            </form>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button class="btn btn-light" @click="closeFieldModal">Cancel</button>
            <button class="btn btn-primary" @click="saveField" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ saving ? 'Saving…' : editingField ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Option Modal (no price field anymore) -->
    <div class="modal fade" :class="{ 'show d-block': showOptionModal }" tabindex="-1" v-if="showOptionModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title">{{ editingOption ? 'Edit Option' : 'Add Option' }}</h5>
            <button class="btn-close" @click="closeOptionModal" />
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveOption">
              <div class="mb-3">
                <label class="form-label">Label *</label>
                <input class="form-control" v-model="currentOption.label" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Value *</label>
                <input class="form-control" v-model="currentOption.value" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Order</label>
                <input type="number" class="form-control" v-model.number="currentOption.order" min="0" />
              </div>
            </form>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button class="btn btn-light" @click="closeOptionModal">Cancel</button>
            <button class="btn btn-primary" @click="saveOption" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ saving ? 'Saving…' : editingOption ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showFieldModal || showOptionModal" class="modal-backdrop fade show" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { generateClient } from 'aws-amplify/api'
import AppHeader from '@/components/AppHeader.vue'
import { handleSignOut } from '../utils/auth'

const client = generateClient()

// state
const loading = ref(false)
const saving = ref(false)
const fields = ref([])
const showFieldModal = ref(false)
const showOptionModal = ref(false)
const editingField = ref(false)
const editingOption = ref(false)
const currentFieldId = ref('')
const selectedCardId = ref('') // set this when you want card-level prices

// models
const currentField = reactive({
  id: null,
  fieldName: '',
  fieldType: '',
  validationRegex: ''
})
const currentOption = reactive({
  id: null,
  label: '',
  value: '',
  order: 0
})

const fieldTypes = ['string', 'number', 'date', 'boolean', 'file', 'select']

const stats = computed(() => [
  { label: 'Total Fields', value: fields.value.length, icon: 'bi bi-list-check', color: '#0d6efd' },
  { label: 'Select Fields', value: fields.value.filter(f => f.fieldType === 'select').length, icon: 'bi bi-ui-checks-grid', color: '#198754' }
])

// Load fields + options (per-card prices if selectedCardId is set)
const loadFields = async () => {
  loading.value = true
  try {
    const { data: baseFields } = await client.models.CardRequiredField.list({
      selectionSet: ['id', 'fieldName', 'fieldType', 'validationRegex']
    })

    const enriched = await Promise.all(
        baseFields.map(async (f) => {
          const { data: options } = await client.models.FieldOption.list({
            filter: { fieldId: { eq: f.id } },
            selectionSet: ['id', 'label', 'value', 'order'] // ⬅️ no price here anymore
          })

          let cardPrices = {}
          if (selectedCardId.value) {
            const { data: links } = await client.models.CardFieldOptionLink.list({
              filter: { cardId: { eq: selectedCardId.value }, fieldId: { eq: f.id } },
              selectionSet: ['optionId', 'price']
            })
            cardPrices = Object.fromEntries(links.map(l => [l.optionId, l.price]))
          }

          return {
            ...f,
            options: options.map(o => ({ ...o, cardPrice: cardPrices[o.id] ?? null }))
          }
        })
    )

    fields.value = enriched
  } catch (err) {
    console.error('Error loading fields:', err)
  } finally {
    loading.value = false
  }
}

// Field CRUD
const saveField = async () => {
  saving.value = true
  try {
    if (editingField.value) {
      await client.models.CardRequiredField.update({
        id: currentField.id,
        fieldName: currentField.fieldName,
        fieldType: currentField.fieldType,
        validationRegex: currentField.validationRegex || null
      })
    } else {
      const { id, ...newField } = currentField
      await client.models.CardRequiredField.create({
        ...newField,
        validationRegex: newField.validationRegex || null
      })
    }
    closeFieldModal()
    await loadFields()
  } catch (err) {
    console.error('Error saving field:', err)
  } finally {
    saving.value = false
  }
}

const deleteField = async (id: string) => {
  if (!confirm('Delete this field and its options?')) return
  try {
    await client.models.CardRequiredField.delete({ id })
    await loadFields()
  } catch (err) {
    console.error('Error deleting field:', err)
  }
}

// Option CRUD (no price anymore)
const saveOption = async () => {
  saving.value = true
  try {
    if (editingOption.value) {
      await client.models.FieldOption.update({
        id: currentOption.id,
        fieldId: currentFieldId.value,
        label: currentOption.label,
        value: currentOption.value,
        order: currentOption.order
      })
    } else {
      const { id, ...newOpt } = currentOption
      await client.models.FieldOption.create({
        fieldId: currentFieldId.value,
        ...newOpt
      })
    }
    closeOptionModal()
    await loadFields()
  } catch (err) {
    console.error('Error saving option:', err)
  } finally {
    saving.value = false
  }
}

const deleteOption = async (id: string) => {
  if (!confirm('Delete this option?')) return
  try {
    await client.models.FieldOption.delete({ id })
    await loadFields()
  } catch (err) {
    console.error('Error deleting option:', err)
  }
}

// UI helpers
const openFieldModal = () => {
  editingField.value = false
  Object.assign(currentField, { id: null, fieldName: '', fieldType: '', validationRegex: '' })
  showFieldModal.value = true
}
const editField = (field: any) => {
  editingField.value = true
  Object.assign(currentField, field)
  showFieldModal.value = true
}
const closeFieldModal = () => (showFieldModal.value = false)

const openOptionModal = (fieldId: string) => {
  editingOption.value = false
  currentFieldId.value = fieldId
  Object.assign(currentOption, { id: null, label: '', value: '', order: 0 })
  showOptionModal.value = true
}
const editOption = (fieldId: string, opt: any) => {
  editingOption.value = true
  currentFieldId.value = fieldId
  Object.assign(currentOption, opt)
  showOptionModal.value = true
}
const closeOptionModal = () => (showOptionModal.value = false)

const sortOptions = (opts: any[]) => [...opts].sort((a, b) => (a.order || 0) - (b.order || 0))

onMounted(() => loadFields())
</script>

<style scoped>
.fs-4 { font-size: 1.5rem; }
</style>
