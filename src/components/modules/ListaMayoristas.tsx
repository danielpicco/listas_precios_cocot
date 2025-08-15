import React, { useState, useMemo } from 'react';
import { ListaPrecios, DescuentosImpuestos } from '../../types';
import { calcularPrecios, calcularUtilidad, formatearPrecio, formatearPorcentaje } from '../../utils/calculations';
import { exportarAExcel } from '../../utils/excel';
import { Download, Search, FileText } from 'lucide-react';

interface ListaMayoristasProps {
  listaActual: ListaPrecios | null;
  descuentos: DescuentosImpuestos;
}

const ListaMayoristas: React.FC<ListaMayoristasProps> = ({ listaActual, descuentos }) => {
  const [busqueda, setBusqueda] = useState('');

  const datosTabla = useMemo(() => {
    if (!listaActual) return [];

    return listaActual.articulos
      .filter(articulo => 
        articulo.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        articulo.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      )
      .map(articulo => {
        const precios = calcularPrecios(articulo.unidad, descuentos);
        const utilidadCatalogo = calcularUtilidad(precios.precioRevendedoresMayorista, precios.costoNetoConIva);
        const utilidadMayorista = calcularUtilidad(precios.precioMayorista, precios.costoNetoConIva);
        
        return {
          codigo: articulo.codigo,
          descripcion: articulo.descripcion,
          precioVtaCatalogo: precios.precioRevendedoresMayorista,
          precioVtaMayorista: precios.precioMayorista,
          precioVentaSugeridoPublico: precios.precioVentaLocal18,
          utilidadCatalogo,
          utilidadMayorista,
          costoNeto: precios.costoNetoConIva
        };
      });
  }, [listaActual, descuentos, busqueda]);

  const exportarExcel = () => {
    if (!datosTabla.length) return;

    const datosExport = datosTabla.map(item => ({
      'Código': item.codigo,
      'Descripción': item.descripcion,
      'Precio Vta. Catálogo': item.precioVtaCatalogo.toFixed(2),
      'Precio Vta. Mayorista': item.precioVtaMayorista.toFixed(2),
      'Precio Venta Sugerido Público': item.precioVentaSugeridoPublico.toFixed(2)
    }));

    const nombreArchivo = `Lista_Mayoristas_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}`;
    exportarAExcel(datosExport, nombreArchivo, 'Lista Mayoristas');
  };

  const mesActual = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Lista {mesActual.charAt(0).toUpperCase() + mesActual.slice(1)} - Sin IVA
        </h2>
        <p className="text-sm text-red-600 font-medium">Los precios pueden variar sin previo aviso</p>
      </div>

      {!listaActual && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            No hay ninguna lista de precios cargada. Por favor, vaya a la sección "Inicio" para cargar una lista.
          </p>
        </div>
      )}

      {listaActual && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar por código o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={exportarExcel}
                disabled={!datosTabla.length}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar a Excel
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Vta. Catálogo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Vta. Mayorista
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Venta Sugerido Público
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilidad Catálogo
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilidad Mayorista
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datosTabla.map((item, index) => (
                    <tr key={item.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {formatearPrecio(item.precioVtaCatalogo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {formatearPrecio(item.precioVtaMayorista)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                        {formatearPrecio(item.precioVentaSugeridoPublico)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.utilidadCatalogo >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {formatearPorcentaje(item.utilidadCatalogo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.utilidadMayorista >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {formatearPorcentaje(item.utilidadMayorista)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {datosTabla.length === 0 && busqueda && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay resultados</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron artículos que coincidan con "{busqueda}"
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Información:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Las utilidades se calculan comparando el precio de venta con el costo neto con IVA</li>
              <li>• Los precios mostrados ya incluyen todos los descuentos configurados</li>
              <li>• La exportación a Excel incluye solo los datos de precios, sin las utilidades</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default ListaMayoristas;