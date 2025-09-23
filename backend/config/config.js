const {createClient} = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {supabase, supabaseService}