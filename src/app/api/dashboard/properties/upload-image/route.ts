import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role === 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const propertyId = formData.get('property_id') as string

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'ID do imóvel é obrigatório' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Apenas imagens JPEG, PNG e WebP são permitidas' },
        { status: 400 }
      )
    }

    // Validar tamanho (máx. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'O arquivo deve ter no máximo 5MB' },
        { status: 400 }
      )
    }

    // Verificar se o imóvel pertence ao tenant
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle()

    if (!property) {
      return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
    }

    // Gerar nome único para o arquivo
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${profile.tenant_id}/${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao fazer upload da imagem' },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName)

    // Inserir registro na tabela property_images
    const { data: imageRecord, error: dbError } = await supabase
      .from('property_images')
      .insert({
        property_id: propertyId,
        url: urlData.publicUrl,
        ordem: 0, // Será atualizado depois se necessário
        is_cover: false,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      // Tentar limpar o arquivo do storage
      await supabase.storage.from('property-images').remove([fileName])
      return NextResponse.json(
        { error: 'Erro ao salvar referência da imagem' },
        { status: 500 }
      )
    }

    return NextResponse.json(imageRecord)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erro ao processar upload' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role === 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json({ error: 'ID da imagem é obrigatório' }, { status: 400 })
    }

    // Buscar a imagem e verificar propriedade
    const { data: image } = await supabase
      .from('property_images')
      .select('*, properties(tenant_id)')
      .eq('id', imageId)
      .maybeSingle()

    if (!image || image.properties?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
    }

    // Extrair caminho do arquivo da URL
    const urlParts = image.url.split('/property-images/')
    const filePath = urlParts[1]

    // Remover do storage
    if (filePath) {
      await supabase.storage.from('property-images').remove([filePath])
    }

    // Remover do banco
    const { error: deleteError } = await supabase
      .from('property_images')
      .delete()
      .eq('id', imageId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Erro ao excluir imagem' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Erro ao processar exclusão' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id || profile.role === 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, is_cover, ordem } = body

    if (!id) {
      return NextResponse.json({ error: 'ID da imagem é obrigatório' }, { status: 400 })
    }

    // Se for definir como cover, desmarcar as outras do mesmo imóvel
    if (is_cover === true) {
      const { data: image } = await supabase
        .from('property_images')
        .select('property_id, properties!inner(tenant_id)')
        .eq('id', id)
        .maybeSingle()

      const tenantId = Array.isArray(image?.properties)
        ? image.properties[0]?.tenant_id
        : (image?.properties as unknown as { tenant_id?: string } | null)?.tenant_id

      if (image && tenantId === profile.tenant_id) {
        await supabase
          .from('property_images')
          .update({ is_cover: false })
          .eq('property_id', image.property_id)
      }
    }

    const updateData: Record<string, unknown> = {}
    if (is_cover !== undefined) updateData.is_cover = is_cover
    if (ordem !== undefined) updateData.ordem = ordem

    const { data: updated, error } = await supabase
      .from('property_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Patch error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar imagem' }, { status: 500 })
  }
}