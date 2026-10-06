export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          nome: string
          slug: string
          email: string
          telefone: string | null
          logo_url: string | null
          active: boolean
          license_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          email: string
          telefone?: string | null
          logo_url?: string | null
          active?: boolean
          license_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          email?: string
          telefone?: string | null
          logo_url?: string | null
          active?: boolean
          license_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string | null
          role: 'admin' | 'imobiliaria_owner' | 'imobiliaria_user' | 'cliente'
          nome: string
          email: string
          telefone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id?: string | null
          role: 'admin' | 'imobiliaria_owner' | 'imobiliaria_user' | 'cliente'
          nome: string
          email: string
          telefone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          role?: 'admin' | 'imobiliaria_owner' | 'imobiliaria_user' | 'cliente'
          nome?: string
          email?: string
          telefone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          tenant_id: string
          titulo: string
          descricao: string
          tipo: 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural'
          finalidade: 'venda' | 'locacao' | 'ambos'
          status: 'disponivel' | 'vendido' | 'alugado' | 'reservado'
          preco_venda: number | null
          preco_locacao: number | null
          endereco: string
          cidade: string
          estado: string
          cep: string
          bairro: string
          area_total: number | null
          area_construida: number | null
          quartos: number | null
          banheiros: number | null
          vagas_garagem: number | null
          caracteristicas: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          titulo: string
          descricao: string
          tipo: 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural'
          finalidade: 'venda' | 'locacao' | 'ambos'
          status?: 'disponivel' | 'vendido' | 'alugado' | 'reservado'
          preco_venda?: number | null
          preco_locacao?: number | null
          endereco: string
          cidade: string
          estado: string
          cep: string
          bairro: string
          area_total?: number | null
          area_construida?: number | null
          quartos?: number | null
          banheiros?: number | null
          vagas_garagem?: number | null
          caracteristicas?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          titulo?: string
          descricao?: string
          tipo?: 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural'
          finalidade?: 'venda' | 'locacao' | 'ambos'
          status?: 'disponivel' | 'vendido' | 'alugado' | 'reservado'
          preco_venda?: number | null
          preco_locacao?: number | null
          endereco?: string
          cidade?: string
          estado?: string
          cep?: string
          bairro?: string
          area_total?: number | null
          area_construida?: number | null
          quartos?: number | null
          banheiros?: number | null
          vagas_garagem?: number | null
          caracteristicas?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
