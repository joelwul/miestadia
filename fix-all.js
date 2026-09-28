const fs = require('fs');
const path = require('path');

console.log('🔧 Reparando todos los archivos...\n');

// 1. Eliminar BOM de todos los archivos .ts y .tsx
function removeBOM(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      removeBOM(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const buffer = fs.readFileSync(filePath);
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        fs.writeFileSync(filePath, buffer.slice(3));
        console.log('✅ BOM eliminado:', path.relative(__dirname, filePath));
      }
    }
  });
}

removeBOM(path.join(__dirname, 'src'));

// 2. Corregir route.ts - variables de entorno
console.log('\n🔧 Corrigiendo route.ts...');
const routePath = path.join(__dirname, 'src', 'app', 'api', 'cron', 'send-emails', 'route.ts');
let routeContent = fs.readFileSync(routePath, 'utf8');
routeContent = routeContent.replace(/NEXT_PUBLIC_SUPABASE_URL/g, 'SUPABASE_URL');
routeContent = routeContent.replace(/SUPABASE_SERVICE_ROLE_KEY/g, 'SUPABASE_ANON_KEY');
fs.writeFileSync(routePath, routeContent, 'utf8');
console.log('✅ route.ts corregido');

// 3. Corregir CSVImport.tsx - agregar tenantId y cambiar onSaved por onImported
console.log('\n🔧 Corrigiendo CSVImport.tsx...');
const csvPath = path.join(__dirname, 'src', 'components', 'reservations', 'CSVImport.tsx');
let csvContent = fs.readFileSync(csvPath, 'utf8');
csvContent = csvContent.replace(/tenantSlug: string\nonClose/, 'tenantSlug: string\n  tenantId: string\n  onClose');
csvContent = csvContent.replace(/CSVImport\(\{ tenantSlug, onClose, onSaved \}/g, 'CSVImport({ tenantSlug, tenantId, onClose, onImported }');
csvContent = csvContent.replace(/onSaved: \(\) => void/g, 'onImported: () => void');
csvContent = csvContent.replace(/onSaved\(\)/g, 'onImported()');
csvContent = csvContent.replace(/\[tenantSlug\]/g, '[tenantId]');
fs.writeFileSync(csvPath, csvContent, 'utf8');
console.log('✅ CSVImport.tsx corregido');

// 4. Corregir page.tsx (landing) - errores de sintaxis
console.log('\n🔧 Corrigiendo landing page.tsx...');
const landingPath = path.join(__dirname, 'src', 'app', 'page.tsx');
let landingContent = fs.readFileSync(landingPath, 'utf8');
// Corregir Navbar sin cierre
landingContent = landingContent.replace(/shadow-sm"\n<div/g, 'shadow-sm">\n    <div');
// Corregir flechas rotas
landingContent = landingContent.replace(/= >/g, '=>');
landingContent = landingContent.replace(/\(\) = >/g, '() =>');
// Corregir espacios en atributos
landingContent = landingContent.replace(/=\s+"/g, '="');
landingContent = landingContent.replace(/"\s+>/g, '">');
fs.writeFileSync(landingPath, landingContent, 'utf8');
console.log('✅ Landing page.tsx corregido');

// 5. Corregir page.tsx (admin) - errores de sintaxis
console.log('\n Corrigiendo admin page.tsx...');
const adminPath = path.join(__dirname, 'src', 'app', '(admin)', '[tenantSlug]', 'admin', 'reservations', 'page.tsx');
let adminContent = fs.readFileSync(adminPath, 'utf8');
// Corregir nombres de variables con espacios
adminContent = adminContent.replace(/s etTenantSettings/g, 'setTenantSettings');
adminContent = adminContent.replace(/setDate From/g, 'setDateFrom');
// Corregir flechas rotas
adminContent = adminContent.replace(/= >/g, '=>');
adminContent = adminContent.replace(/\(\) = >/g, '() =>');
// Corregir espacios en atributos
adminContent = adminContent.replace(/=\s+"/g, '="');
adminContent = adminContent.replace(/"\s+>/g, '">');
fs.writeFileSync(adminPath, adminContent, 'utf8');
console.log('✅ Admin page.tsx corregido');

console.log('\n🎉 ¡REPARACIÓN COMPLETADA!');
console.log('\n📋 Próximos pasos:');
console.log('1. Ejecutá: git add .');
console.log('2. Ejecutá: git commit -m "Fix: BOM + sintaxis + variables"');
console.log('3. Ejecutá: git push origin main');
console.log('4. Esperá 2 minutos y Vercel va a deployar automáticamente');