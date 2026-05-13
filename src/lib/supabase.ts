import { createClient } from '@supabase/supabase-js';

const finalUrl = 'https://fhreetfchulrwzsyzvzt.supabase.co';
const finalKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmVldGZjaHVscnd6c3l6dnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDcwMTUsImV4cCI6MjA5NDIyMzAxNX0.xMqpmeAfCDi_KCHBys_RSwqFrRx9VpJdB9gmIoeAlCE';

export const supabase = createClient(finalUrl, finalKey);
