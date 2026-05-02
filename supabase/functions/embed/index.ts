import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Khởi tạo Supabase AI
// @ts-ignore
const model = new Supabase.ai.Session('gte-small');

serve(async (req) => {
  try {
    // 1. Kết nối Database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Lấy dữ liệu từ Webhook
    const payload = await req.json()
    const { record, table } = payload
    
    if (table !== 'resources' || !record) {
      return new Response("Not a resource event", { status: 200 })
    }

    const textToEmbed = `${record.name} ${record.tags ? record.tags.join(' ') : ''}`
    console.log(`Đang tạo Vector bằng Supabase AI cho: ${record.name}`)

    // 3. Tạo Embedding bằng model nội bộ (KHÔNG CẦN TOKEN)
    const embedding = await model.run(textToEmbed, {
      mean_pool: true,
      normalize: true,
    });

    // 4. Lưu vào bảng phụ resource_embeddings (Upsert)
    const { error } = await supabase
      .from('resource_embeddings')
      .upsert({ 
        id: record.id, 
        embedding: Array.from(embedding) 
      })

    if (error) throw error

    console.log(`Thành công! Đã lưu Vector vào bảng phụ cho ${record.name}`)

    return new Response(JSON.stringify({ success: true }), { 
      headers: { 'Content-Type': 'application/json' } 
    })

  } catch (err) {
    console.error(`Lỗi: ${err.message}`)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
