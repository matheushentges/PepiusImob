import assert from 'node:assert/strict'
import test from 'node:test'
import { createTeamMemberSchema } from '../src/lib/team/validation.ts'

test('createTeamMemberSchema accepts valid member payload', () => {
  const valid = {
    nome: 'Carlos Corretor',
    email: 'carlos@imobiliaria.com.br',
    password: 'senhaForte123!',
    role: 'imobiliaria_user',
  }
  const result = createTeamMemberSchema.safeParse(valid)
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.email, 'carlos@imobiliaria.com.br')
    assert.equal(result.data.role, 'imobiliaria_user')
  }
})

test('createTeamMemberSchema normalizes email to lowercase and trims name', () => {
  const input = {
    nome: '  Ana Maria Silva  ',
    email: '  ANA.SILVA@EXEMPLO.COM  ',
    password: 'outraSenhaSegura2026',
    role: 'imobiliaria_owner',
  }
  const result = createTeamMemberSchema.safeParse(input)
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.nome, 'Ana Maria Silva')
    assert.equal(result.data.email, 'ana.silva@exemplo.com')
  }
})

test('createTeamMemberSchema rejects invalid input', () => {
  // Short password (< 8 chars)
  const shortPass = createTeamMemberSchema.safeParse({
    nome: 'Nome Valido',
    email: 'email@valido.com',
    password: '123',
    role: 'imobiliaria_user',
  })
  assert.equal(shortPass.success, false)

  // Invalid email
  const badEmail = createTeamMemberSchema.safeParse({
    nome: 'Nome Valido',
    email: 'nao-e-email',
    password: 'senhaLongaValida123',
    role: 'imobiliaria_user',
  })
  assert.equal(badEmail.success, false)

  // Invalid role (not in enum)
  const badRole = createTeamMemberSchema.safeParse({
    nome: 'Nome Valido',
    email: 'email@valido.com',
    password: 'senhaLongaValida123',
    role: 'admin_global',
  })
  assert.equal(badRole.success, false)

  // Empty name
  const emptyName = createTeamMemberSchema.safeParse({
    nome: ' ',
    email: 'email@valido.com',
    password: 'senhaLongaValida123',
    role: 'imobiliaria_user',
  })
  assert.equal(emptyName.success, false)
})
