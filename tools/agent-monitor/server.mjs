import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333
const BRAIN_BASE = path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain')

// Lista todas as conversas disponíveis ordenadas pela mais recente
function listConversations() {
  try {
    if (!fs.existsSync(BRAIN_BASE)) return []
    const entries = fs.readdirSync(BRAIN_BASE, { withFileTypes: true })
    const dirs = []
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(BRAIN_BASE, entry.name)
        try {
          const stat = fs.statSync(fullPath)
          dirs.push({
            id: entry.name,
            mtimeMs: stat.mtimeMs,
            updatedAt: stat.mtime.toISOString(),
          })
        } catch {
          // ignora diretório inacessível
        }
      }
    }
    return dirs.sort((a, b) => b.mtimeMs - a.mtimeMs)
  } catch (err) {
    console.error('Erro ao listar conversas:', err)
    return []
  }
}

// Analisa e extrai o progresso do task.md
function parseTaskFile(convDir) {
  const taskFile = path.join(convDir, 'task.md')
  if (!fs.existsSync(taskFile)) {
    return { exists: false, total: 0, completed: 0, inProgress: 0, pending: 0, percent: 0, tasks: [] }
  }

  try {
    const content = fs.readFileSync(taskFile, 'utf8')
    const lines = content.split('\n')
    const tasks = []
    let completed = 0
    let inProgress = 0
    let pending = 0

    for (const line of lines) {
      const match = line.match(/^-\s*\[(x|\/|\s)\]\s*(.*)$/i)
      if (match) {
        const marker = match[1].toLowerCase().trim()
        let status = 'pending'
        if (marker === 'x') {
          status = 'completed'
          completed++
        } else if (marker === '/') {
          status = 'in_progress'
          inProgress++
        } else {
          status = 'pending'
          pending++
        }

        // Remove comentários HTML como <!-- id: task-1 -->
        const rawTitle = match[2].replace(/<!--.*?-->/g, '').trim()
        tasks.push({
          title: rawTitle,
          status,
        })
      }
    }

    const total = tasks.length
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      exists: true,
      total,
      completed,
      inProgress,
      pending,
      percent,
      tasks,
    }
  } catch (err) {
    console.warn('Erro ao ler task.md:', err)
    return { exists: false, total: 0, completed: 0, inProgress: 0, pending: 0, percent: 0, tasks: [] }
  }
}

// Analisa os passos e subagentes em transcript.jsonl
function parseTranscript(convDir, limit = 60) {
  const logFile = path.join(convDir, '.system_generated', 'logs', 'transcript.jsonl')
  if (!fs.existsSync(logFile)) {
    return {
      stepsCount: 0,
      activities: [],
      subagents: [],
      lastAction: null,
      activeTool: null,
    }
  }

  try {
    const rawContent = fs.readFileSync(logFile, 'utf8')
    const lines = rawContent.split('\n').filter(Boolean)
    const stepsCount = lines.length

    // Lê os últimos N passos
    const slice = lines.slice(-limit)
    const activities = []
    const subagentsMap = new Map()

    let activeTool = null
    let lastAction = null

    for (let i = slice.length - 1; i >= 0; i--) {
      try {
        const step = JSON.parse(slice[i])
        const createdAt = step.created_at || new Date().toISOString()
        const source = step.source || 'MODEL'
        const type = step.type || 'STEP'

        // Detecta tool calls
        if (step.tool_calls && Array.isArray(step.tool_calls)) {
          for (const tc of step.tool_calls) {
            const toolName = tc.name || 'tool'
            const toolAction = tc.args?.toolAction?.replace(/^"|"$/g, '') || toolName
            const toolSummary = tc.args?.toolSummary?.replace(/^"|"$/g, '') || ''
            
            // Subagent detection (ex: invoke_subagent or specific subagent triggers)
            let subagentRole = null
            if (toolName.includes('subagent') || tc.args?.TypeName) {
              subagentRole = tc.args?.TypeName || 'subagent'
            }

            const act = {
              id: `${step.step_index}-${toolName}-${activities.length}`,
              stepIndex: step.step_index,
              time: createdAt,
              type: 'TOOL',
              toolName,
              action: toolAction,
              summary: toolSummary,
              subagentRole,
              argsSnippet: tc.args ? JSON.stringify(tc.args).slice(0, 160) : '',
            }

            activities.push(act)

            if (!activeTool && activities.length === 1) {
              activeTool = act
            }

            // Registra subagente no mapa
            if (subagentRole) {
              if (!subagentsMap.has(subagentRole)) {
                subagentsMap.set(subagentRole, {
                  role: subagentRole,
                  lastSeen: createdAt,
                  lastAction: toolAction,
                  status: 'running',
                })
              }
            }
          }
        } else if (step.type === 'USER_INPUT') {
          // Mensagem do usuário
          const content = typeof step.content === 'string' ? step.content : ''
          const cleanUserText = content
            .replace(/<USER_REQUEST>|<\/USER_REQUEST>/g, '')
            .replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, '')
            .trim()

          activities.push({
            id: `step-${step.step_index}-user`,
            stepIndex: step.step_index,
            time: createdAt,
            type: 'USER',
            toolName: 'user_input',
            action: 'Instrução do Usuário',
            summary: cleanUserText.slice(0, 140),
            argsSnippet: cleanUserText,
          })
        } else if (step.type === 'PLANNER_RESPONSE' && step.thinking) {
          // Raciocínio interno
          activities.push({
            id: `step-${step.step_index}-think`,
            stepIndex: step.step_index,
            time: createdAt,
            type: 'THINK',
            toolName: 'planning',
            action: 'Planejamento / Análise',
            summary: step.thinking.slice(0, 150),
            argsSnippet: step.thinking.slice(0, 300),
          })
        }
      } catch {
        // linha inválida ou truncada ignorada
      }
    }

    if (activities.length > 0) {
      lastAction = activities[0]
    }

    // Identifica subagentes do Superpowers padrão se não detectados no slice recente
    const knownSuperpowers = ['implementer', 'code-reviewer', 'spec-reviewer', 're-reviewer']
    for (const role of knownSuperpowers) {
      if (!subagentsMap.has(role)) {
        subagentsMap.set(role, {
          role,
          lastSeen: null,
          lastAction: 'Disponível no Superpowers',
          status: 'idle',
        })
      }
    }

    return {
      stepsCount,
      activities: activities.slice(0, 40),
      subagents: Array.from(subagentsMap.values()),
      lastAction,
      activeTool,
    }
  } catch (err) {
    console.error('Erro ao processar transcript:', err)
    return {
      stepsCount: 0,
      activities: [],
      subagents: [],
      lastAction: null,
      activeTool: null,
    }
  }
}

// Analisa logs de comandos em segundo plano
function getBackgroundTasks(convDir) {
  const tasksDir = path.join(convDir, '.system_generated', 'tasks')
  if (!fs.existsSync(tasksDir)) return []

  try {
    const files = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.log'))
    const tasks = []

    for (const f of files) {
      const fullPath = path.join(tasksDir, f)
      try {
        const stat = fs.statSync(fullPath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const lines = content.split('\n')
        const tailLines = lines.slice(-25).join('\n')

        tasks.push({
          id: f.replace('.log', ''),
          fileName: f,
          sizeBytes: stat.size,
          mtime: stat.mtime.toISOString(),
          tail: tailLines,
        })
      } catch {
        // ignora arquivo
      }
    }

    return tasks.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime())
  } catch {
    return []
  }
}

// Monta o snapshot completo de telemetria
function buildFullState(selectedConvId) {
  const conversations = listConversations()
  let currentId = selectedConvId

  if (!currentId && conversations.length > 0) {
    currentId = conversations[0].id
  }

  if (!currentId) {
    return {
      connected: false,
      conversations: [],
      currentConversationId: null,
      taskData: { exists: false, total: 0, completed: 0, percent: 0, tasks: [] },
      transcriptData: { stepsCount: 0, activities: [], subagents: [] },
      backgroundTasks: [],
      timestamp: new Date().toISOString(),
    }
  }

  const convDir = path.join(BRAIN_BASE, currentId)
  const taskData = parseTaskFile(convDir)
  const transcriptData = parseTranscript(convDir)
  const backgroundTasks = getBackgroundTasks(convDir)

  return {
    connected: true,
    conversations,
    currentConversationId: currentId,
    taskData,
    transcriptData,
    backgroundTasks,
    timestamp: new Date().toISOString(),
  }
}

// Clientes SSE conectados
const sseClients = new Set()

function broadcastUpdate(state) {
  const dataString = `data: ${JSON.stringify(state)}\n\n`
  for (const client of sseClients) {
    try {
      client.write(dataString)
    } catch {
      sseClients.delete(client)
    }
  }
}

// Servidor HTTP Nativo
let currentSessionId = process.env.CONVERSATION_ID || null

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`)
  const pathname = reqUrl.pathname

  // ROTA SSE: Stream em tempo real
  if (pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    sseClients.add(res)
    res.write(`: connected\n\n`)

    // Envia estado inicial
    const state = buildFullState(currentSessionId)
    res.write(`data: ${JSON.stringify(state)}\n\n`)

    req.on('close', () => {
      sseClients.delete(res)
    })
    return
  }

  // ROTA JSON: Snapshot atual
  if (pathname === '/api/state') {
    const requestedId = reqUrl.searchParams.get('id') || currentSessionId
    const state = buildFullState(requestedId)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(state))
    return
  }

  // ROTA: Trocar conversa ativa observada
  if (pathname === '/api/session' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body)
        if (parsed.id) {
          currentSessionId = parsed.id
          broadcastUpdate(buildFullState(currentSessionId))
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, currentSessionId }))
      } catch {
        res.writeHead(400)
        res.end('Invalid JSON')
      }
    })
    return
  }

  // Arquivos Estáticos (Front-End)
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', 'index.html')
  }

  const ext = path.extname(filePath)
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
  }

  const contentType = mimeTypes[ext] || 'text/plain'

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('404 Not Found')
      return
    }
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(content)
  })
})

// Intervalo de verificação de alterações (watch leve a cada 750ms)
let lastStateHash = ''
setInterval(() => {
  if (sseClients.size === 0) return

  const state = buildFullState(currentSessionId)
  const hash = `${state.currentConversationId}-${state.taskData.completed}/${state.taskData.total}-${state.transcriptData.stepsCount}-${state.transcriptData.lastAction?.id}`

  if (hash !== lastStateHash) {
    lastStateHash = hash
    broadcastUpdate(state)
  }
}, 750)

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n========================================================`)
  console.log(`🚀 PEPIUS AGENT MONITOR & SUPERPOWERS MISSION CONTROL`)
  console.log(`📡 Painel Local Ativo: http://localhost:${PORT}`)
  console.log(`📁 Diretório de telemetria: ${BRAIN_BASE}`)
  console.log(`========================================================\n`)
})
