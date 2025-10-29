<template>
  <div class="cards">
    <AppHeader title="Cards" @sign-out="handleSignOut" />

    <main class="p-4">
      <div class="container-fluid">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 class="h3 mb-1 fw-bold">Card Management</h1>
            <p class="text-muted mb-0">{{ cards.length }} card{{ cards.length !== 1 ? 's' : '' }}</p>
          </div>
          <button class="btn btn-primary" @click="openCreateCard" :disabled="loading">
            <i class="bi bi-plus-circle me-2"></i>{{ loading ? 'Loading…' : 'Add Card' }}
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" />
        </div>

        <!-- Empty -->
        <div v-else-if="!cards.length" class="text-center py-5 bg-light rounded">
          <i class="bi bi-inbox display-4 text-muted mb-3" />
          <h5>No cards yet</h5>
          <button class="btn btn-primary mt-2" @click="openCreateCard">Add First Card</button>
        </div>

        <!-- List -->
        <div v-else class="row g-3">
          <div v-for="card in cards" :key="card.id" class="col-12">
            <div class="card border h-100" :class="{ 'opacity-75': !card.isActive }">
              <div class="card-header border-0 border-bottom d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="mb-0">{{ card.name }}</h5>
                  <div class="text-muted small">{{ card.type }} — ${{ Number(card.price).toFixed(2) }}</div>
                </div>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-secondary" @click="editCard(card)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-primary" @click="openManageFields(card)">
                    <i class="bi bi-sliders"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteCard(card.id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>

              <div class="card-body">
                <div v-if="card.links?.length">
                  <ul class="list-group small">
                    <li v-for="link in card.links" :key="link.id"
                        class="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{{ link.field?.fieldName }}</strong>
                        <small class="text-muted ms-2">({{ link.field?.fieldType }})</small>
                        <span v-if="link.affectsPrice && link.field?.fieldType==='select'"
                              class="badge bg-warning text-dark ms-2">Affects price</span>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <span v-if="link.isRequired" class="badge bg-danger">Required</span>
                        <button
                            v-if="link.field?.fieldType==='select'"
                            class="btn btn-sm btn-outline-secondary"
                            :disabled="!link.affectsPrice"
                            @click="openOptionPrices(card, link)"
                            title="Set option prices"
                        >
                          <i class="bi bi-cash"></i>
                        </button>
                      </div>
                    </li>
                  </ul>
                </div>
                <div v-else class="text-muted small">No fields linked yet</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create/Edit Card Modal -->
    <div class="modal fade" :class="{ 'show d-block': showAddModal }" v-if="showAddModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Edit Card' : 'New Card' }}</h5>
            <button class="btn-close" @click="closeCardModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveCard">
              <div class="mb-3">
                <label class="form-label">Name *</label>
                <input v-model="currentCard.name" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Type *</label>
                <input v-model="currentCard.type" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Price *</label>
                <input type="number" min="0" step="0.01" v-model.number="currentCard.price" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea v-model="currentCard.description" class="form-control"></textarea>
              </div>
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="currentCard.isActive" id="activeSwitch">
                <label for="activeSwitch" class="form-check-label">Active</label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" @click="closeCardModal">Cancel</button>
            <button class="btn btn-primary" @click="saveCard" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2" />
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Manage Fields Modal -->
    <div class="modal fade" :class="{ 'show d-block': showManageModal }" v-if="showManageModal">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header">
            <h5 class="modal-title">Manage Fields — {{ manageCard?.name }}</h5>
            <button class="btn-close" @click="closeManageModal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info py-2">
              Only one <strong>select</strong> field per card can <em>affect price</em>. Enabling it here will disable the flag on other fields for this card.
            </div>

            <div v-if="manageLoading" class="text-center py-4">
              <div class="spinner-border text-primary" />
            </div>
            <div v-else>
              <div v-for="fld in allFields" :key="fld.id" class="d-flex align-items-center justify-content-between border-bottom py-2">
                <div>
                  <strong>{{ fld.fieldName }}</strong>
                  <small class="text-muted ms-1">({{ fld.fieldType }})</small>
                </div>
                <div class="d-flex align-items-center gap-3">
                  <!-- Required switch (only when linked) -->
                  <div class="form-check form-switch" v-if="fieldSelection[fld.id]">
                    <input class="form-check-input" type="checkbox"
                           v-model="requiredByFieldId[fld.id]"
                           @change="updateRequiredFlag(fld)" />
                    <label class="form-check-label small">Required</label>
                  </div>

                  <!-- Affects price (select + linked) -->
                  <div class="form-check form-switch" v-if="fld.fieldType==='select' && fieldSelection[fld.id]">
                    <input class="form-check-input" type="checkbox"
                           :checked="affectsPriceByFieldId[fld.id] || false"
                           @change="toggleAffectsPrice(fld)"
                           :title="affectsPriceByFieldId[fld.id] ? 'Unset affects price' : 'Set as price field'" />
                    <label class="form-check-label small">Affects price</label>
                  </div>

                  <!-- Option prices (enabled only if affectsPrice) -->
                  <button class="btn btn-sm btn-outline-secondary"
                          v-if="fld.fieldType==='select' && fieldSelection[fld.id]"
                          :disabled="!affectsPriceByFieldId[fld.id]"
                          @click="openOptionPrices(manageCard!, linkByFieldId[fld.id])">
                    <i class="bi bi-cash"></i>
                  </button>

                  <!-- Attach/detach -->
                  <input type="checkbox"
                         :checked="fieldSelection[fld.id] || false"
                         @change="toggleField(fld)" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" @click="closeManageModal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Option Prices Modal (per cardFieldLink) -->
    <div class="modal fade" :class="{ 'show d-block': showOptionModal }" v-if="showOptionModal">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0">
          <div class="modal-header">
            <h5 class="modal-title">Option Prices — {{ selectedLink?.field?.fieldName }}</h5>
            <button class="btn-close" @click="closeOptionModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="optionsLoading" class="text-center py-4">
              <div class="spinner-border text-primary" />
            </div>
            <div v-else>
              <table class="table table-sm align-middle">
                <thead>
                <tr><th>Label</th><th>Value</th><th style="width:220px;">Set price</th></tr>
                </thead>
                <tbody>
                <tr v-for="opt in fieldOptions" :key="opt.id">
                  <td>{{ opt.label }}</td>
                  <td><code>{{ opt.value }}</code></td>
                  <td>
                    <div class="input-group input-group-sm">
                      <span class="input-group-text">$</span>
                      <input type="number" min="0" step="0.01"
                             class="form-control"
                             :value="priceInputs[opt.id] ?? ''"
                             @blur="e => handleOptionPriceChange(opt, (e.target as HTMLInputElement).value)"
                             placeholder="(use card price)" />
                    </div>
                  </td>
                </tr>
                </tbody>
              </table>
              <small class="text-muted">
                Leave empty to fall back to the card price. Prices here are absolute “set” prices.
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light" @click="closeOptionModal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="showAddModal || showManageModal || showOptionModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { generateClient } from 'aws-amplify/api'
import AppHeader from '@/components/AppHeader.vue'
import { handleSignOut } from '../utils/auth'

const client = generateClient()

// ---- state ----
const loading = ref(false)
const saving = ref(false)
const cards = ref<any[]>([])

// create/edit card
const showAddModal = ref(false)
const isEditing = ref(false)
const currentCard = reactive({ id: '', name: '', type: '', price: 0, description: '', isActive: true })

// manage fields
const showManageModal = ref(false)
const manageCard = ref<any | null>(null)
const manageLoading = ref(false)
const allFields = ref<any[]>([])
const fieldSelection = reactive<Record<string, boolean>>({})
const requiredByFieldId = reactive<Record<string, boolean>>({})
const affectsPriceByFieldId = reactive<Record<string, boolean>>({})
const linkByFieldId = reactive<Record<string, any>>({})

// option prices
const showOptionModal = ref(false)
const optionsLoading = ref(false)
const selectedLink = ref<any | null>(null) // CardFieldLink with embedded field
const fieldOptions = ref<any[]>([])
const priceInputs = reactive<Record<string, number | null>>({})

// ---- load cards with links+fields ----
const loadCards = async () => {
  loading.value = true
  try {
    const { data } = await client.models.Card.list({})
    for (const c of data) {
      const { data: links } = await client.models.CardFieldLink.list({ filter: { cardId: { eq: c.id } } })
      const withFields: any[] = []
      for (const link of links) {
        const { data: fld } = await client.models.CardRequiredField.get({ id: link.fieldId })
        withFields.push({ ...link, field: fld })
      }
      c.links = withFields
    }
    cards.value = data
  } finally {
    loading.value = false
  }
}

// ---- card CRUD ----
const openCreateCard = () => {
  Object.assign(currentCard, { id: '', name: '', type: '', price: 0, description: '', isActive: true })
  isEditing.value = false
  showAddModal.value = true
}
const editCard = (card: any) => {
  Object.assign(currentCard, card)
  isEditing.value = true
  showAddModal.value = true
}
const saveCard = async () => {
  saving.value = true
  try {
    if (isEditing.value && currentCard.id) {
      await client.models.Card.update({
        id: currentCard.id,
        name: currentCard.name,
        type: currentCard.type,
        price: currentCard.price,
        description: currentCard.description || null,
        isActive: currentCard.isActive
      })
    } else {
      await client.models.Card.create({
        name: currentCard.name,
        type: currentCard.type,
        price: currentCard.price,
        description: currentCard.description || null,
        isActive: currentCard.isActive
      })
    }
    showAddModal.value = false
    await loadCards()
  } catch (e) {
    console.error('Error saving card', e)
  } finally {
    saving.value = false
  }
}
const closeCardModal = () => { showAddModal.value = false }
const deleteCard = async (id: string) => {
  if (!confirm('Delete card?')) return
  await client.models.Card.delete({ id })
  await loadCards()
}

// ---- manage fields per card ----
const openManageFields = async (card: any) => {
  manageCard.value = card
  showManageModal.value = true
  await loadManageData()
}
const closeManageModal = () => { showManageModal.value = false }

const loadManageData = async () => {
  manageLoading.value = true
  try {
    const { data: fields } = await client.models.CardRequiredField.list({})
    allFields.value = fields

    const { data: links } = await client.models.CardFieldLink.list({ filter: { cardId: { eq: manageCard.value!.id } } })

    // reset UI maps
    for (const f of fields) {
      fieldSelection[f.id] = false
      requiredByFieldId[f.id] = false
      affectsPriceByFieldId[f.id] = false
    }
    for (const l of links) {
      fieldSelection[l.fieldId] = true
      requiredByFieldId[l.fieldId] = !!l.isRequired
      affectsPriceByFieldId[l.fieldId] = !!l.affectsPrice
      linkByFieldId[l.fieldId] = l
    }
  } finally {
    manageLoading.value = false
  }
}

const toggleField = async (fld: any) => {
  // attach
  if (!fieldSelection[fld.id]) {
    const { data } = await client.models.CardFieldLink.create({
      cardId: manageCard.value!.id,
      fieldId: fld.id,
      isRequired: true,
      affectsPrice: false,
      label: null,
      placeholder: null,
      order: 0
    })
    linkByFieldId[fld.id] = data
    fieldSelection[fld.id] = true
    requiredByFieldId[fld.id] = true
    affectsPriceByFieldId[fld.id] = false
  } else {
    // detach (also purge option overrides for this link)
    const link = linkByFieldId[fld.id]
    if (link?.id) {
      const { data: overrides } = await client.models.CardFieldOptionLink.list({
        filter: { cardFieldLinkId: { eq: link.id } }
      })
      for (const row of overrides) {
        await client.models.CardFieldOptionLink.delete({ id: row.id })
      }
      await client.models.CardFieldLink.delete({ id: link.id })
    }
    fieldSelection[fld.id] = false
    delete linkByFieldId[fld.id]
    delete requiredByFieldId[fld.id]
    delete affectsPriceByFieldId[fld.id]
  }
  await loadCards()
}

const updateRequiredFlag = async (fld: any) => {
  const link = linkByFieldId[fld.id]
  if (!link) return
  const { data } = await client.models.CardFieldLink.update({
    id: link.id,
    isRequired: !!requiredByFieldId[fld.id]
  })
  linkByFieldId[fld.id] = data
  await loadCards()
}

/**
 * Enforce: Only ONE field per card may have affectsPrice=true.
 * If enabling for one field:
 *  - Find any other links for this card with affectsPrice=true, set to false, and purge their overrides.
 *  - Then set affectsPrice=true for the selected link.
 * If disabling:
 *  - Just set false and purge this link's overrides.
 */
const toggleAffectsPrice = async (fld: any) => {
  const link = linkByFieldId[fld.id]
  if (!link) return

  const enabling = !affectsPriceByFieldId[fld.id]

  if (enabling) {
    // turn OFF other price-affecting links on this card
    const { data: otherLinks } = await client.models.CardFieldLink.list({
      filter: { cardId: { eq: manageCard.value!.id }, affectsPrice: { eq: true } }
    })
    for (const l of otherLinks) {
      if (l.id === link.id) continue
      // set affectsPrice=false
      await client.models.CardFieldLink.update({ id: l.id, affectsPrice: false })
      affectsPriceByFieldId[l.fieldId] = false
      // purge their overrides
      const { data: toDelete } = await client.models.CardFieldOptionLink.list({
        filter: { cardFieldLinkId: { eq: l.id } }
      })
      for (const row of toDelete) {
        await client.models.CardFieldOptionLink.delete({ id: row.id })
      }
    }
  }

  // toggle this link
  const { data: updated } = await client.models.CardFieldLink.update({
    id: link.id,
    affectsPrice: enabling
  })
  linkByFieldId[fld.id] = updated
  affectsPriceByFieldId[fld.id] = updated.affectsPrice

  // If disabling, purge overrides for this link too
  if (!updated.affectsPrice) {
    const { data: toDelete } = await client.models.CardFieldOptionLink.list({
      filter: { cardFieldLinkId: { eq: updated.id } }
    })
    for (const row of toDelete) {
      await client.models.CardFieldOptionLink.delete({ id: row.id })
    }
  }

  await loadCards()
}

// ---- option prices per link ----
const openOptionPrices = async (card: any, link: any) => {
  const { data: field } = await client.models.CardRequiredField.get({ id: link.fieldId })
  selectedLink.value = { ...link, field }
  showOptionModal.value = true
  await loadOptions()
}
const closeOptionModal = () => {
  showOptionModal.value = false
  selectedLink.value = null
  fieldOptions.value = []
  Object.keys(priceInputs).forEach(k => delete priceInputs[k])
}

const loadOptions = async () => {
  optionsLoading.value = true
  try {
    const { data: opts } = await client.models.FieldOption.list({ filter: { fieldId: { eq: selectedLink.value!.fieldId } } })
    fieldOptions.value = [...opts].sort((a, b) => (a.order || 0) - (b.order || 0))

    const { data: overrides } = await client.models.CardFieldOptionLink.list({
      filter: { cardFieldLinkId: { eq: selectedLink.value!.id } }
    })
    for (const row of overrides) {
      priceInputs[row.optionId] = row.price
    }
  } finally {
    optionsLoading.value = false
  }
}

const handleOptionPriceChange = async (opt: any, raw: string) => {
  const val = raw === '' ? null : Number(raw)
  priceInputs[opt.id] = val

  const { data: existing } = await client.models.CardFieldOptionLink.list({
    filter: {
      cardFieldLinkId: { eq: selectedLink.value!.id },
      optionId: { eq: opt.id }
    }
  })

  if (existing.length && val == null) {
    await client.models.CardFieldOptionLink.delete({ id: existing[0].id })
  } else if (existing.length && val != null) {
    await client.models.CardFieldOptionLink.update({
      id: existing[0].id,
      price: val,
      mode: 'set'
    })
  } else if (!existing.length && val != null) {
    await client.models.CardFieldOptionLink.create({
      cardFieldLinkId: selectedLink.value!.id,
      cardId: selectedLink.value!.cardId,
      fieldId: selectedLink.value!.fieldId,
      optionId: opt.id,
      price: val,
      mode: 'set'
    })
  }
}

onMounted(loadCards)
</script>

<style scoped>
.modal-backdrop { z-index: 1050; }
</style>
