const STORAGE_KEY = 'mithub.gateway.v0'

const thought = document.querySelector('#raw-thought')
const modes = [...document.querySelectorAll('.mode')]
const toast = document.querySelector('#toast')
let currentMode = 'expand'
let currentStructure = null

function notify(message) {
  toast.textContent = message
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 2600)
}

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    thought.value = saved.thought || ''
    currentMode = saved.mode || 'expand'
    modes.forEach((button) => button.classList.toggle('active', button.dataset.mode === currentMode))
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function saveDraft(showNotice = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    thought: thought.value,
    mode: currentMode,
    savedAt: new Date().toISOString()
  }))
  if (showNotice) notify('Private draft saved on this device. Nothing was uploaded.')
}

function sentencesFrom(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function titleFrom(text) {
  const first = sentencesFrom(text)[0] || text
  const words = first.replace(/^(i think|what if|i want to|my idea is|imagine)\s+/i, '').split(/\s+/).slice(0, 9)
  const title = words.join(' ').replace(/[.!?]+$/, '')
  return title ? title.charAt(0).toUpperCase() + title.slice(1) : 'Untitled experiment'
}

function structureThought(text, mode) {
  const sentences = sentencesFrom(text)
  const proposition = sentences[0] || text
  const keywords = [...new Set(text.toLowerCase().match(/[a-z][a-z-]{4,}/g) || [])]
    .filter((word) => !['about', 'because', 'there', 'their', 'would', 'could', 'should', 'something', 'really'].includes(word))
    .slice(0, 4)

  const claims = [
    `The central proposition can be stated clearly enough to test: “${proposition.slice(0, 180)}${proposition.length > 180 ? '…' : ''}”`,
    keywords.length ? `The important concepts appear to include ${keywords.join(', ')}; each needs a plain definition.` : 'The important terms need plain definitions before testing.',
    mode === 'attack' ? 'The strongest counterexample and the most inconvenient prior work must be sought first.' : 'A result that would change your mind must be named in advance.'
  ]

  const tests = {
    expand: [
      'Make the smallest public artifact that demonstrates the idea without claiming the whole universe.',
      'Invite one builder and one sceptic to describe what they think the claim means.',
      'Record what changed between the raw thought, interpretation and result.'
    ],
    attack: [
      'Write the strongest version of the claim, then identify its single most load-bearing mechanism.',
      'Search for a counterexample and a prior system that already solved part of it.',
      'Publish a reproducible failure condition and give the target a right of reply.'
    ],
    test: [
      'State a falsifiable hypothesis and one observable outcome.',
      'Freeze the method before seeing the result.',
      'Run a tiny comparison, preserve the data and publish limitations.'
    ],
    listen: [
      'Keep this as an attributed thought without forcing it into a claim.',
      'Return later and mark what still feels alive.',
      'Only structure or publish when you explicitly choose to.'
    ]
  }

  return {
    schema: 'mithub.experiment-seed/v0',
    status: 'FUCK_AROUND',
    status_authority: 'NONE',
    title: titleFrom(text),
    raw_thought: text,
    interpretation: {
      mode,
      core_proposition: proposition,
      claims_to_examine: claims,
      possible_tests: tests[mode]
    },
    boundaries: {
      canonical_impact: 'NONE',
      model_disclosure: 'Browser-only heuristic prototype; no AI model was called.',
      promotion_requires: ['separate proposal', 'evidence bundle', 'protected pull request', 'human review']
    },
    created_at: new Date().toISOString()
  }
}

function renderStructure(structure) {
  document.querySelector('#empty-state').classList.add('hidden')
  document.querySelector('#structured-output').classList.remove('hidden')
  document.querySelector('#working-title').textContent = structure.title
  document.querySelector('#core-proposition').textContent = structure.interpretation.core_proposition
  document.querySelector('#claims-list').innerHTML = structure.interpretation.claims_to_examine.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  document.querySelector('#tests-list').innerHTML = structure.interpretation.possible_tests.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
}

function escapeHtml(value) {
  const div = document.createElement('div')
  div.textContent = value
  return div.innerHTML
}

function downloadJson(name, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

modes.forEach((button) => {
  button.addEventListener('click', () => {
    currentMode = button.dataset.mode
    modes.forEach((candidate) => candidate.classList.toggle('active', candidate === button))
    saveDraft(false)
  })
})

thought.addEventListener('input', () => saveDraft(false))
document.querySelector('#save-draft').addEventListener('click', () => saveDraft())
document.querySelector('#structure').addEventListener('click', () => {
  const text = thought.value.trim()
  if (!text) {
    thought.focus()
    notify('Give me at least one gloriously messy sentence first.')
    return
  }
  currentStructure = structureThought(text, currentMode)
  renderStructure(currentStructure)
  saveDraft(false)
  notify('A separate interpretation was created. Your original words are untouched.')
})

document.querySelector('#export-experiment').addEventListener('click', () => {
  if (!currentStructure) return
  const slug = currentStructure.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  downloadJson(`mithub-${slug || 'experiment'}.json`, currentStructure)
  notify('Experiment pack exported. It is labelled noncanonical.')
})

const locationDialog = document.querySelector('#location-dialog')
const realDialog = document.querySelector('#real-dialog')
document.querySelector('#where-am-i').addEventListener('click', () => locationDialog.showModal())
document.querySelector('#make-real').addEventListener('click', () => realDialog.showModal())
document.querySelectorAll('.dialog-close').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()))

document.querySelector('#download-proposal').addEventListener('click', () => {
  if (!currentStructure) return
  downloadJson('mithub-canonical-proposal-request.json', {
    schema: 'mithub.promotion-request/v0',
    status: 'PROPOSAL',
    status_authority: 'NONE',
    source_experiment: currentStructure,
    explicit_non_authorization: [
      'This file cannot merge or modify main.',
      'This request does not clear canonical reds.',
      'Human review and repository checks remain mandatory.'
    ],
    requested_at: new Date().toISOString()
  })
  realDialog.close()
  notify('Proposal request downloaded. Canonical state remains untouched.')
})

document.querySelectorAll('.lesson-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const lesson = document.querySelector(`#${button.dataset.lesson}`)
    const opening = lesson.classList.contains('hidden')
    lesson.classList.toggle('hidden')
    button.textContent = opening ? 'Close lesson' : 'Open lesson'
  })
})

loadDraft()
