import dotenv from "dotenv";
dotenv.config({ path: '.env.example' });

async function run() {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  
  const vipDef = data.definitions?.tasks_vip_history;
  console.log("VIP Columns:", vipDef ? Object.keys(vipDef.properties) : "NULL");

  const preDef = data.definitions?.tasks_pre_history;
  console.log("PRE Columns:", preDef ? Object.keys(preDef.properties) : "NULL");
}

run();
