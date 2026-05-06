import fs from 'fs';
let content = fs.readFileSync('api/app_server.ts', 'utf-8');
content = content.replace(/new Date\(\)\.toLocaleString\('vi-VN'\)/g, "new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })");
fs.writeFileSync('api/app_server.ts', content);
