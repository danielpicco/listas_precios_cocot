import React, { useState, useMemo } from 'react';
import { ListaPrecios, ComparativoItem } from '../../types';
import { exportarAExcel } from '../../utils/excel';
import { formatearPrecio, formatearPorcentaje } from '../../utils/calculations';
import { Download, TrendingUp, TrendingDown, Minus, BarChart3, ArrowUpDown } from 'lucide-react';

interface ComparativoPreciosProps {
  listaActual: ListaPrecios | null;
  listasAnteriores: ListaPrecios[];
}

const ComparativoPrecios: React.FC<ComparativoPreciosProps> = ({ 
  listaActual, 
  listasAnteriores 
}) => {
  const [listaAnteriorSeleccionada, setListaAnteriorSeleccionada] = useState<string>('');
  const [ordenPor, setOrdenPor] = useState<'codigo' | 'incremento'>('codigo');
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('asc');

  const datosComparativo = useMemo((): ComparativoItem[] => {
    if (!listaActual || !listaAnteriorSeleccionada) return [];

    const listaAnterior = listasAnteriores.find(l => l.id === listaAnteriorSeleccionada);
    if (!listaAnterior) return [];

    const comparativo: ComparativoItem[] = [];

    listaActual.articulos.forEach(articuloActual => {
      const articuloAnterior = listaAnterior.articulos.find(
        a => a.codigo === articuloActual.codigo
      );

      if (articuloAnterior) {
        const incremento = articuloActual.unidad - articuloAnterior.unidad;
        const porcentajeIncremento = articuloAnterior.unidad > 0 
          ? (incremento / articuloAnterior.unidad) * 100 
          : 0;

        comparativo.push({
          codigo: articuloActual.codigo,
          descripcion: articuloActual.descripcion,
          precioActual: articuloActual.unidad,
          precioAnterior: articuloAnterior.unidad,
          incremento,
          porcentajeIncremento
        });
      }
    });

    // Ordenar datos
    return comparativo.sort((a, b) => {
      let resultado = 0;
      
      if (ordenPor === 'codigo') {
        resultado = a.codigo.localeCompare(b.codigo);
      } else {
        resultado = a.incremento - b.incremento;
      }

      return ordenDireccion === 'desc' ? -resultado : resultado;
    });
  }, [listaActual, listaAnteriorSeleccionada, listasAnteriores, ordenPor, ordenDireccion]);

  const estadisticas = useMemo(() => {
    if (datosComparativo.length === 0) return null;

    const incrementos = datosComparativo.filter(item => item.incremento > 0);
    const decrementos = datosComparativo.filter(item => item.incremento < 0);
    const sinCambios = datosComparativo.filter(item => item.incremento === 0);

    const promedioIncremento = datosComparativo.reduce((sum, item) => sum + item.porcentajeIncremento, 0) / datosComparativo.length;
    const incrementoMaximo = Math.max(...datosComparativo.map(item => item.porcentajeIncremento));
    const incrementoMinimo = Math.min(...datosComparativo.map(item => item.porcentajeIncremento));

    return {
      totalArticulos: datosComparativo.length,
      incrementos: incrementos.length,
      decrementos: decrementos.length,
      sinCambios: sinCambios.length,
      promedioIncremento,
      incrementoMaximo,
      incrementoMinimo
    };
  }, [datosComparativo]);

  const exportarComparativo = () => {
    if (!datosComparativo.length) return;

    const datosExport = datosComparativo.map(item => ({
      'Código': item.codigo,
      'Descripción': item.descripcion,
      'Precio Actual': item.precioActual.toFixed(2),
      'Precio Anterior': item.precioAnterior.toFixed(2),
      'Incremento ($)': item.incremento.toFixed(2),
      'Incremento (%)': item.porcentajeIncremento.toFixed(2)
    }));

    const nombreArchivo = `Comparativo_Precios_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}`;
    exportarAExcel(datosExport, nombreArchivo, 'Comparativo');
  };

  const cambiarOrden = (campo: 'codigo' | 'incremento') => {
    if (ordenPor === campo) {
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenPor(campo);
      setOrdenDireccion('asc');
    }
  };

  const getIconoVariacion = (incremento: number) => {
    if (incremento > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (incremento < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Comparativo de Variación de Precios</h2>
        <p className="text-lg text-gray-600">Compare precios entre diferentes listas para analizar variaciones</p>
      </div>

      {!listaActual && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            No hay ninguna lista actual cargada. Por favor, vaya a la sección "Inicio" para cargar una lista.
          </p>
        </div>
      )}

      {listaActual && listasAnteriores.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800">
            No hay listas anteriores disponibles para comparar. Las listas se guardan automáticamente cuando carga una nueva.
          </p>
        </div>
      )}

      {listaActual && listasAnteriores.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lista Actual (Lista 1):
                </label>
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="font-semibold text-green-800">{listaActual.nombre}</p>
                  <p className="text-sm text-green-600">
                    {listaActual.articulos.length} artículos - {new Date(listaActual.fecha).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lista Anterior (Lista 2):
                </label>
                <select
                  value={listaAnteriorSeleccionada}
                  onChange={(e) => setListaAnteriorSeleccionada(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione una lista anterior...</option>
                  {listasAnteriores.map(lista => (
                    <option key={lista.id} value={lista.id}>
                      {lista.nombre} - {new Date(lista.fecha).toLocaleDateString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {estadisticas && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Estadísticas del Comparativo
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-600">Total Artículos</p>
                  <p className="text-2xl font-bold text-blue-900">{estadisticas.totalArticulos}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-600">Con Incrementos</p>
                  <p className="text-2xl font-bold text-red-900">{estadisticas.incrementos}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Con Decrementos</p>
                  <p className="text-2xl font-bold text-green-900">{estadisticas.decrementos}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Sin Cambios</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.sinCambios}</p>
                </div>
              </div>
              
              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Incremento Promedio</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatearPorcentaje(estadisticas.promedioIncremento)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Incremento Máximo</p>
                  <p className="text-lg font-bold text-red-900">
                    {formatearPorcentaje(estadisticas.incrementoMaximo)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Incremento Mínimo</p>
                  <p className="text-lg font-bold text-green-900">
                    {formatearPorcentaje(estadisticas.incrementoMinimo)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {datosComparativo.length > 0 && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
                    <button
                      onClick={() => cambiarOrden('codigo')}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        ordenPor === 'codigo' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Código
                      {ordenPor === 'codigo' && <ArrowUpDown className="ml-1 h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => cambiarOrden('incremento')}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        ordenPor === 'incremento' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Incremento
                      {ordenPor === 'incremento' && <ArrowUpDown className="ml-1 h-3 w-3" />}
                    </button>
                  </div>
                  
                  <button
                    onClick={exportarComparativo}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Comparativo
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
                          Precio Actual
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio Anterior
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Incremento ($)
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Incremento (%)
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variación
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {datosComparativo.map((item, index) => (
                        <tr key={item.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.codigo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {item.descripcion}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                            {formatearPrecio(item.precioActual)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatearPrecio(item.precioAnterior)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                            <span className={
                              item.incremento > 0 ? 'text-red-600' :
                              item.incremento < 0 ? 'text-green-600' : 'text-gray-600'
                            }>
                              {item.incremento > 0 ? '+' : ''}{formatearPrecio(item.incremento)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.porcentajeIncremento > 0 ? 'bg-red-100 text-red-800' :
                              item.porcentajeIncremento < 0 ? 'bg-green-100 text-green-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.porcentajeIncremento > 0 ? '+' : ''}{formatearPorcentaje(item.porcentajeIncremento)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getIconoVariacion(item.incremento)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ComparativoPrecios;