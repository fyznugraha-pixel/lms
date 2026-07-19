const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
      callback(dirPath);
    }
  });
}

walkDir('./src', (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Arrays
  newContent = newContent.replace(/'PENANGGUNG_JAWAB_ABSEN',\s*/g, '');
  
  // Logical OR checks
  newContent = newContent.replace(/role === ['"]PENANGGUNG_JAWAB_ABSEN['"]\s*\|\|\s*/g, '');
  newContent = newContent.replace(/\|\|\s*role === ['"]PENANGGUNG_JAWAB_ABSEN['"]/g, '');
  newContent = newContent.replace(/payload\.role === ['"]PENANGGUNG_JAWAB_ABSEN['"]\s*\|\|\s*/g, '');
  newContent = newContent.replace(/\|\|\s*payload\.role === ['"]PENANGGUNG_JAWAB_ABSEN['"]/g, '');
  newContent = newContent.replace(/payload\.role !== ['"]PENANGGUNG_JAWAB_ABSEN['"]\s*&&\s*/g, '');
  newContent = newContent.replace(/&&\s*payload\.role !== ['"]PENANGGUNG_JAWAB_ABSEN['"]/g, '');

  // Specific ternary or checks
  newContent = newContent.replace(/\(payload\.role !== 'PENANGGUNG_JAWAB_ABSEN' && payload\.role !== 'SUPER_ADMIN'\)/g, "(payload.role !== 'SUPER_ADMIN')");
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated ' + file);
  }
});
