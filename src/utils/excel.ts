import * as XLSX from 'xlsx';
import { Articulo } from '../types';

export const leerArchivoExcel = (file: File): Promise<{ nombreLista: string; articulos: Articulo[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const articulos: Articulo[] = jsonData.map((row: any) => ({
          codigo: String(row['Artículo'] || row['Articulo'] || row['ARTICULO'] || ''),
          descripcion: String(row['Descripción'] || row['Descripcion'] || row['DESCRIPCION'] || ''),
          color: String(row['Color'] || row['COLOR'] || ''),
          talle: String(row['Talle'] || row['TALLE'] || ''),
          unidad: Number(row['Unidad'] || row['unidad'] || 0),
          sugerido: Number(row['Sugerido'] || row['sugerido'] || 0),
          origen: String(row['Origen'] || row['origen'] || '')
        }));

        resolve({
          nombreLista: file.name.replace(/\.[^/.]+$/, ''),
          articulos
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const exportarAExcel = (datos: any[], nombreArchivo = 'export.xlsx') => {
  try {
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Datos');
    XLSX.writeFile(libro, nombreArchivo);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
  }
};
