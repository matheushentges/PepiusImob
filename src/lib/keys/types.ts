export type KeyStatus =
  | 'disponivel'
  | 'com_consultor'
  | 'com_cliente'
  | 'em_manutencao'
  | 'outros'

export type KeyHolderType =
  | 'consultor'
  | 'cliente'
  | 'prestador'
  | 'outros'

export interface PropertyKey {
  id: string
  tenant_id: string
  property_id: string
  codigo: string
  status: KeyStatus
  localizacao: string | null
  created_at: string
  updated_at: string
}

export interface KeyMovement {
  id: string
  tenant_id: string
  key_id: string
  property_id: string
  tipo_responsavel: KeyHolderType
  consultor_id: string | null
  nome_responsavel: string
  telefone_responsavel: string | null
  documento_responsavel: string | null
  motivo: string | null
  data_saida: string
  previsao_retorno: string | null
  data_devolucao: string | null
  observacoes_saida: string | null
  observacoes_devolucao: string | null
  registrado_por: string | null
  recebido_por: string | null
  created_at: string
  updated_at: string
  consultor?: {
    id: string
    nome: string
    email: string
  } | null
}

export interface KeyOverviewItem {
  id: string
  propertyId: string
  propertyTitle: string
  propertyType: string
  propertyPurpose: string
  propertyCity: string
  propertyState: string
  propertyNeighborhood: string
  codigo: string
  status: KeyStatus
  localizacao: string | null
  updatedAt: string
  currentMovement?: {
    id: string
    tipoResponsavel: KeyHolderType
    nomeResponsavel: string
    telefoneResponsavel: string | null
    documentoResponsavel: string | null
    motivo: string | null
    dataSaida: string
    previsaoRetorno: string | null
    isLate: boolean
    minutesLate: number
    consultorNome?: string | null
  } | null
}
