export type ClientType = 'pf' | 'pj'
export type ClientRole = 'proprietario' | 'comprador' | 'locatario' | 'fiador'
export type ClientStatus = 'ativo' | 'inativo' | 'potencial' | 'arquivado'

export interface ClientBankData {
  banco?: string
  agencia?: string
  conta?: string
  tipo_conta?: 'corrente' | 'poupanca'
  tipo_chave_pix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'
  chave_pix?: string
  titular?: string
}

export interface ClientSearchProfile {
  tipos_imovel?: Array<'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural'>
  finalidade?: 'venda' | 'locacao' | 'ambos'
  valor_minimo?: number | null
  valor_maximo?: number | null
  quartos_minimo?: number | null
  vagas_minimo?: number | null
  bairros_interesse?: string[]
  cidades_interesse?: string[]
}

export interface Client {
  id: string
  tenant_id: string
  tipo_pessoa: ClientType
  papeis: ClientRole[]
  status: ClientStatus
  nome: string
  nome_fantasia?: string | null
  documento?: string | null
  rg_ie?: string | null
  data_nascimento?: string | null
  profissao?: string | null
  estado_civil?: string | null
  regime_bens?: string | null
  conjuge_nome?: string | null
  conjuge_cpf?: string | null
  email?: string | null
  email_secundario?: string | null
  telefone: string
  telefone_secundario?: string | null
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  dados_bancarios: ClientBankData
  perfil_interesse: ClientSearchProfile
  corretor_id?: string | null
  corretor_nome?: string | null
  observacoes?: string | null
  created_at: string
  updated_at: string
}

export interface ClientNote {
  id: string
  tenant_id: string
  client_id: string
  autor_id?: string | null
  autor_nome?: string | null
  conteudo: string
  created_at: string
}

export interface ClientOverviewStats {
  total: number
  proprietarios: number
  compradores: number
  locatarios: number
  ativos: number
}

export interface PropertyMatchResult {
  propertyId: string
  titulo: string
  tipo: string
  finalidade: string
  precoVenda: number | null
  precoLocacao: number | null
  bairro: string
  cidade: string
  quartos: number | null
  vagasGaragem: number | null
  areaTotal: number | null
  coverUrl?: string | null
  matchScore: number // 0 a 100
  matchReasons: string[]
}

export interface ReverseClientMatchResult {
  clientId: string
  nome: string
  telefone: string
  email?: string | null
  papeis: ClientRole[]
  corretorNome?: string | null
  matchScore: number
  matchReasons: string[]
  whatsappUrl?: string | null
}
