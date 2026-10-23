import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('agent monitor files exist and are well structured', () => {
  const serverPath = path.resolve(process.cwd(), 'tools/agent-monitor/server.mjs')
  const htmlPath = path.resolve(process.cwd(), 'tools/agent-monitor/public/index.html')
  const cssPath = path.resolve(process.cwd(), 'tools/agent-monitor/public/style.css')
  const jsPath = path.resolve(process.cwd(), 'tools/agent-monitor/public/app.js')

  assert.ok(fs.existsSync(serverPath), 'server.mjs must exist')
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist')
  assert.ok(fs.existsSync(cssPath), 'style.css must exist')
  assert.ok(fs.existsSync(jsPath), 'app.js must exist')

  const serverContent = fs.readFileSync(serverPath, 'utf8')
  assert.ok(serverContent.includes('parseTaskFile'), 'server must contain parseTaskFile')
  assert.ok(serverContent.includes('parseTranscript'), 'server must contain parseTranscript')
  assert.ok(serverContent.includes('/api/events'), 'server must support SSE endpoint')
})
