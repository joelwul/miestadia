const fs = require('fs');
const path = require('path');

console.log('🧹 Limpiando archivos...\n');

// Eliminar BOM de todos los archivos .ts y .tsx
function limpiarBOM(dir) {
  const archivos = fs.readdirSync(dir);
  archivos.forEach(archivo => {
    const ruta = path.join(dir, archivo);
    const stat = fs.statSync(ruta);
    if (stat.isDirectory()) {
      limpiarBOM(ruta);
    } else if (archivo.endsWith('.ts') || archivo.endsWith('.tsx')) {
      const buffer = fs.readFileSync(ruta);
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        fs.writeFileSync(ruta, buffer.slice(3));
        console.log('✅ BOM eliminado:', path.relative(__dirname, ruta));
      }
    }
  });
}

limpiarBOM(path.join(__dirname, 'src'));
console.log('\n✨ ¡Archivos limpios!');