import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  sanitizeDocument,
  isValidCPF,
  isValidCNPJ,
  formatDocument,
  formatPhoneBR,
  clientInputSchema,
  clientNoteInputSchema,
} from '../src/lib/clients/validation.ts'

test('sanitizeDocument removes non-digits', () => {
  assert.equal(sanitizeDocument('123.456.789-00'), '12345678900')
  assert.equal(sanitizeDocument('(11) 98765-4321'), '11987654321')
  assert.equal(sanitizeDocument(''), '')
  assert.equal(sanitizeDocument(null), '')
})

test('isValidCPF identifies valid and invalid CPFs correctly', () => {
  // CPFs com dígitos verificadores matematicamente válidos
  assert.equal(isValidCPF('52998224725'), true)
  assert.equal(isValidCPF('529.982.247-25'), true)

  // CPFs inválidos ou repetidos
  assert.equal(isValidCPF('11111111111'), false)
  assert.equal(isValidCPF('12345678900'), false)
  assert.equal(isValidCPF('123'), false)
})

test('isValidCNPJ identifies valid and invalid CNPJs correctly', () => {
  // CNPJ matematicamente válido
  assert.equal(isValidCNPJ('04.252.011/0001-10'), true)
  assert.equal(isValidCNPJ('04252011000110'), true)

  // CNPJs inválidos
  assert.equal(isValidCNPJ('11111111111111'), false)
  assert.equal(isValidCNPJ('00000000000000'), false)
  assert.equal(isValidCNPJ('12345678000199'), false)
})

test('formatDocument formats CPF and CNPJ properly', () => {
  assert.equal(formatDocument('52998224725'), '529.982.247-25')
  assert.equal(formatDocument('04252011000110'), '04.252.011/0001-10')
})

test('formatPhoneBR formats 10 and 11 digit numbers', () => {
  assert.equal(formatPhoneBR('11987654321'), '(11) 98765-4321')
  assert.equal(formatPhoneBR('1133334444'), '(11) 3333-4444')
})

test('clientInputSchema accepts valid PF payload', () => {
  const payload = {
    tipo_pessoa: 'pf',
    papeis: ['proprietario', 'comprador'],
    status: 'ativo',
    nome: 'João da Silva',
    documento: '52998224725',
    telefone: '11987654321',
    email: 'joao@exemplo.com.br',
    dados_bancarios: {
      banco: '001 - Banco do Brasil',
      chave_pix: 'joao@exemplo.com.br',
      tipo_chave_pix: 'email',
    },
    perfil_interesse: {
      tipos_imovel: ['apartamento', 'casa'],
      finalidade: 'venda',
      valor_maximo: 850000,
      quartos_minimo: 3,
    },
  }

  const result = clientInputSchema.safeParse(payload)
  assert.ok(result.success)
  assert.equal(result.data.nome, 'João da Silva')
  assert.equal(result.data.papeis.length, 2)
})

test('clientInputSchema rejects empty roles or invalid CPF', () => {
  const resultNoRole = clientInputSchema.safeParse({
    nome: 'Cliente Sem Papel',
    papeis: [],
    telefone: '11999999999',
  })
  assert.equal(resultNoRole.success, false)

  const resultBadCpf = clientInputSchema.safeParse({
    nome: 'Cliente CPF Inválido',
    papeis: ['locatario'],
    documento: '12345678999',
    telefone: '11999999999',
  })
  assert.equal(resultBadCpf.success, false)
})

test('clientNoteInputSchema validates notes', () => {
  const valid = clientNoteInputSchema.safeParse({ conteudo: 'Cliente solicitou agendamento para sábado' })
  assert.ok(valid.success)

  const empty = clientNoteInputSchema.safeParse({ conteudo: '' })
  assert.equal(empty.success, false)
})
