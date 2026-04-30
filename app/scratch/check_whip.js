
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkResource() {
  const { data, error } = await supabase
    .from('resources')
    .select('id, name, slug, folder_id, category_id')
    .eq('slug', 'whip-5')
    .single();

  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Resource data:", JSON.stringify(data, null, 2));

  if (data.folder_id) {
    const { data: folder, error: fError } = await supabase
      .from('folders')
      .select('id, name, path')
      .eq('id', data.folder_id)
      .single();
    
    if (fError) {
      console.error("Folder error:", fError);
    } else {
      console.log("Folder data:", JSON.stringify(folder, null, 2));
    }
  }
}

checkResource();
