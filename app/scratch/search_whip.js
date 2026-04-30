
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchWhip() {
  const { data, error } = await supabase
    .from('resources')
    .select('id, name, slug, folder_id, category_id')
    .ilike('name', '%Whip%')
    .limit(5);

  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Found resources:", JSON.stringify(data, null, 2));
}

searchWhip();
