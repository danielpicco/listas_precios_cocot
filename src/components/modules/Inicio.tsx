import React, { useState } from 'react';
import { ListaPrecios } from '../../types';
import { leerArchivoExcel } from '../../utils/excel';
import FileUpload from '../FileUpload';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface InicioProps {
  onListaActualizada: (lista: ListaPrecios) => void;
  listaActual: ListaPrecios | null;
}

const Inicio: React.FC<InicioProps> = ({ onListaActualizada, listaActual }) => {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);

  const handleFileUpload = async (file: File, tipo: 'linea' | 'mallas') => {
    try {
      setLoading(true);
      setMensaje(null);

      const { nombreLista, articulos } = await leerArchivoExcel(file);

      if (articulos.length === 0) {
        throw new Error('El archivo no contiene datos válidos');
      }

      const nuevaLista: ListaPrecios = {
        id: `${tipo}-${Date.now()}`,
        nombre: nombreLista,
        nombreLista: nombreLista,
        fecha: new Date(),
        articulos,
        tipo
      };

      onListaActualizada(nuevaLista);
      
      // Intentar guardar en backend (Netlify Functions + Blobs)
      try {
        const resp = await fetch('/.netlify/functions/upload-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lista: nuevaLista, nombre: nuevaLista?.nombre })
        });
        if (resp.ok) {
          const data = await resp.json();
          console.log('Lista guardada en servidor:', data?.key);
          setMensaje({ tipo: 'success', texto: 'Lista guardada en producción correctamente.' });
        } else {
          console.warn('No se pudo guardar en servidor, status:', resp.status);
        }
      } catch (err) {
        console.warn('Backend no disponible, se mantiene solo en este navegador.');
      }
      setMensaje({
        tipo: 'success',
        texto: `Lista "${nombreLista}" cargada exitosamente. ${articulos.length} artículos importados.`
      });
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: error instanceof Error ? error.message : 'Error al procesar el archivo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Sistema de Gestión de Listas de Precios</h2>
        <p className="text-lg text-gray-600">
          Importe sus listas de precios y comience a gestionar sus datos
        </p>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {listaActual && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Lista Actual Cargada:</h3>
          <p className="text-blue-800">
            <strong>{listaActual.nombre}</strong> - {listaActual.articulos.length} artículos
          </p>
          <p className="text-sm text-blue-600">
            Cargada el: {new Date(listaActual.fecha).toLocaleDateString('es-AR')}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Artículos de Línea</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Procesando archivo...</p>
            </div>
          ) : (
            <FileUpload
              onFileUpload={(file) => handleFileUpload(file, 'linea')}
              title="Importar Lista de Artículos"
              description="Suba un archivo Excel con los campos: Artículo, Descripción, Color, Talle, Unidad, Sugerido, Origen"
            />
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Artículos Mallas</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Procesando archivo...</p>
            </div>
          ) : (
            <FileUpload
              onFileUpload={(file) => handleFileUpload(file, 'mallas')}
              title="Importar Lista de Mallas"
              description="Suba un archivo Excel con los mismos campos que artículos de línea"
            />
          )}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-800 mb-2">Información Importante:</h3>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
          <li>Cuando se carga una nueva lista, la actual se guarda automáticamente para comparativas posteriores</li>
          <li>Los archivos Excel deben tener los campos en las columnas correctas</li>
          <li>Se aceptan formatos .xlsx y .xls</li>
          <li>Asegúrese de que los precios estén en formato numérico</li>
        </ul>
      </div>
    </div>
  );
};

export default Inicio;
