
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhreetfchulrwzsyzvzt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmVldGZjaHVscnd6c3l6dnp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY0NzAxNSwiZXhwIjoyMDk0MjIzMDE1fQ.uoImj0v6ggebYqD59LbRQHizdM6LK0zy6FTd73rkDDo';

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseKey
);
