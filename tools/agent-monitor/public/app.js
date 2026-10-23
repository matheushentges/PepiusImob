// Agent Monitor Client App

let soundEnabled = true
let previousCompletedTasks = 0
let lastSelectedLogId = ''

// Live Clock
function updateClock() {
  const el = document.getElementById('liveClock')
  if (el) {
    el.textContent = new Date().toLocaleTimeString('pt-BR')
  }
}
setInterval(updateClock, 1000)
updateClock()

// Web Audio API Synthesizer (Zero asset dependency)
function playNotificationChime() {
  if (!soundEnabled) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {
    // áudio bloqueado ou não suportado
  }
}

// Sound toggle
const btnSound = document.getElementById('btnSound')
const soundLabel = document.getElementById('soundLabel')
const soundIcon = document.getElementById('soundIcon')

btnSound.addEventListener('click', () => {
  soundEnabled = !soundEnabled
  soundLabel.textContent = soundEnabled ? 'Ligado' : 'Mudo'
  soundIcon.textContent = soundEnabled ? '🔊' : '🔇'
  if (soundEnabled) playNotificationChime()
})

// Subagent Avatars
const roleAvatars = {
  implementer: '🛠️',
  'code-reviewer': '🛡️',
  'spec-reviewer': '🔍',
  're-reviewer': '🔄',
  coordinator: '🤖',
}

// Render Subagents
function renderSubagents(subagents) {
  const container = document.getElementById('subagentsList')
  if (!container) return

  const list = [
    {
      role: 'coordinator',
      title: 'Antigravity Coordinator',
      lastAction: 'Orquestração Central do Projeto',
      status: 'active',
    },
    ...subagents.map((s) => ({
      role: s.role,
      title: s.role.replace('-', ' '),
      lastAction: s.lastAction,
      status: s.status,
    })),
  ]

  container.innerHTML = list
    .map((agent) => {
      const avatar = roleAvatars[agent.role] || '⚡'
      const isRunning = agent.status === 'running' || agent.status === 'active'
      const statusClass = isRunning ? 'status-active' : 'status-idle'
      const statusText = isRunning ? 'Em Ação' : 'Aguardando'

      return `
        <div class="subagent-item">
          <div class="subagent-info">
            <div class="subagent-avatar">${avatar}</div>
            <div>
              <div class="subagent-name">${agent.title}</div>
              <div class="subagent-action">${agent.lastAction || 'Pronto para execução'}</div>
            </div>
          </div>
          <span class="subagent-status ${statusClass}">${statusText}</span>
        </div>
      `
    })
    .join('')
}

// Render Tasks (task.md)
function renderTasks(taskData) {
  const listEl = document.getElementById('taskList')
  const badgeEl = document.getElementById('taskBadgePercent')
  const progressFill = document.getElementById('progressFill')
  const valProgress = document.getElementById('valProgress')
  const valTasksSummary = document.getElementById('valTasksSummary')

  if (!taskData || !taskData.exists) {
    if (listEl) listEl.innerHTML = '<div class="empty-state">Nenhum task.md encontrado nesta sessão.</div>'
    return
  }

  const percent = taskData.percent || 0
  if (badgeEl) badgeEl.textContent = `${percent}%`
  if (progressFill) progressFill.style.width = `${percent}%`
  if (valProgress) valProgress.textContent = `${percent}%`
  if (valTasksSummary) {
    valTasksSummary.textContent = `${taskData.completed} de ${taskData.total} concluídas`
  }

  // Toca som se uma tarefa foi concluída
  if (taskData.completed > previousCompletedTasks && previousCompletedTasks > 0) {
    playNotificationChime()
  }
  previousCompletedTasks = taskData.completed

  if (!listEl) return

  listEl.innerHTML = taskData.tasks
    .map((t) => {
      let icon = '○'
      if (t.status === 'completed') icon = '✔'
      if (t.status === 'in_progress') icon = '⏳'

      return `
        <div class="task-item ${t.status}">
          <span class="task-icon">${icon}</span>
          <span class="task-title">${t.title}</span>
        </div>
      `
    })
    .join('')
}

// Render Activity Feed
function renderActivities(activities) {
  const container = document.getElementById('activityFeed')
  if (!container) return

  if (!activities || activities.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhum evento registrado ainda.</div>'
    return
  }

  container.innerHTML = activities
    .map((act) => {
      const timeStr = act.time ? new Date(act.time).toLocaleTimeString('pt-BR') : '--:--:--'
      let badgeClass = 'activity-tool-badge'
      let badgeText = act.toolName || 'action'

      if (act.type === 'USER') {
        badgeText = 'USUÁRIO'
      } else if (act.type === 'THINK') {
        badgeText = 'RACIOCÍNIO'
      }

      return `
        <div class="activity-card">
          <div class="activity-header">
            <span class="${badgeClass}">${badgeText}</span>
            <span class="activity-time">${timeStr}</span>
          </div>
          <div class="activity-action">${act.action}</div>
          ${act.summary ? `<div class="activity-summary">${act.summary}</div>` : ''}
          ${
            act.argsSnippet && act.argsSnippet !== act.summary
              ? `<pre class="activity-code">${act.argsSnippet}</pre>`
              : ''
          }
        </div>
      `
    })
    .join('')
}

// Render Background Tasks / Terminal
function renderTerminal(tasks) {
  const select = document.getElementById('taskLogSelect')
  const output = document.getElementById('terminalOutput')
  if (!select || !output) return

  if (!tasks || tasks.length === 0) {
    select.innerHTML = '<option value="">Nenhum processo</option>'
    return
  }

  const currentVal = select.value || tasks[0].id

  select.innerHTML = tasks
    .map((t) => `<option value="${t.id}" ${t.id === currentVal ? 'selected' : ''}>${t.fileName}</option>`)
    .join('')

  const activeTask = tasks.find((t) => t.id === select.value) || tasks[0]
  if (activeTask) {
    output.textContent = activeTask.tail || 'Processo em execução...'
    output.scrollTop = output.scrollHeight
  }
}

// Sessions Dropdown
function updateSessions(conversations, currentId) {
  const select = document.getElementById('sessionSelect')
  const footSession = document.getElementById('footSessionId')
  if (!select) return

  if (footSession && currentId) {
    footSession.textContent = currentId
  }

  const optionsHtml = conversations
    .map(
      (c) => `
      <option value="${c.id}" ${c.id === currentId ? 'selected' : ''}>
        ${c.id.slice(0, 8)}... (${new Date(c.updatedAt).toLocaleTimeString('pt-BR')})
      </option>
    `,
    )
    .join('')

  if (select.innerHTML !== optionsHtml) {
    select.innerHTML = optionsHtml
  }
}

document.getElementById('sessionSelect').addEventListener('change', async (e) => {
  const newId = e.target.value
  if (!newId) return
  try {
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newId }),
    })
  } catch (err) {
    console.error('Falha ao trocar sessão:', err)
  }
})

document.getElementById('btnClearTerminal').addEventListener('click', () => {
  const output = document.getElementById('terminalOutput')
  if (output) output.textContent = '[Terminal limpo pelo usuário]\n'
})

// SSE Connection
function connectSSE() {
  const connStatus = document.getElementById('connectionStatus')
  const eventSource = new EventSource('/api/events')

  eventSource.onopen = () => {
    if (connStatus) {
      connStatus.className = 'connection-status connected'
      connStatus.querySelector('.status-text').textContent = 'CONECTADO EM TEMPO REAL'
    }
  }

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (!data) return

      // Atualiza métricas principais
      const valSteps = document.getElementById('valSteps')
      const valLastAction = document.getElementById('valLastAction')
      const valLastActionTime = document.getElementById('valLastActionTime')

      if (valSteps) valSteps.textContent = data.transcriptData?.stepsCount || 0
      if (valLastAction && data.transcriptData?.lastAction) {
        valLastAction.textContent = data.transcriptData.lastAction.action
      }
      if (valLastActionTime && data.transcriptData?.lastAction) {
        valLastActionTime.textContent = new Date(data.transcriptData.lastAction.time).toLocaleTimeString('pt-BR')
      }

      // Atualiza componentes
      updateSessions(data.conversations || [], data.currentConversationId)
      renderSubagents(data.transcriptData?.subagents || [])
      renderTasks(data.taskData)
      renderActivities(data.transcriptData?.activities || [])
      renderTerminal(data.backgroundTasks || [])
    } catch (err) {
      console.warn('Erro ao processar evento SSE:', err)
    }
  }

  eventSource.onerror = () => {
    if (connStatus) {
      connStatus.className = 'connection-status'
      connStatus.querySelector('.status-text').textContent = 'RECONECTANDO...'
    }
    eventSource.close()
    setTimeout(connectSSE, 3000)
  }
}

connectSSE()
