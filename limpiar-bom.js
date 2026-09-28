const fs = require('fs');
const path = require('path');

function limpiarBOM(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      limpiarBOM(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const buffer = fs.readFileSync(filePath);
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        fs.writeFileSync(filePath, buffer.slice(3));
        console.log('✅ BOM eliminado:', path.relative(__dirname, filePath));
      }
    }
  });
}

limpiarBOM(path.join(__dirname, 'src'));
console.log('✨ ¡Listo!');