import React, { useState } from 'react';
import { ListaPrecios, DescuentosImpuestos, Articulo } from '../../types';
import { calcularPrecios, formatearPrecio, formatearPorcentaje } from '../../utils/calculations';
import { Search, ShoppingCart, TrendingUp } from 'lucide-react';

interface ConsultaPreciosProps {
  listaActual: ListaPrecios | null;
  descuentos: DescuentosImpuestos;
}

const ConsultaPrecios: React.FC<ConsultaPreciosProps> = ({ listaActual, descuentos }) => {
  const [codigo, setCodigo] = useState('');
  const [articuloEncontrado, setArticuloEncontrado] = useState<Articulo | null>(null);

  const buscarArticulo = () => {
    if (!listaActual || !codigo.trim()) {
      setArticuloEncontrado(null);
      return;
    }

    const articulo = listaActual.articulos.find(
      art => art.codigo.toLowerCase() === codigo.toLowerCase().trim()
    );
    
    setArticuloEncontrado(articulo || null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarArticulo();
    }
  };

  const precios = articuloEncontrado ? calcularPrecios(articuloEncontrado.unidad, descuentos) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Consulta Rápida de Precios</h2>
        <p className="text-base text-gray-600">Ingrese el código del artículo para ver todos los precios calculados</p>
      </div>

      {!listaActual && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-yellow-800">
            No hay ninguna lista de precios cargada. Por favor, vaya a la sección "Inicio" para cargar una lista.
          </p>
        </div>
      )}

      {listaActual && (
        <>
          <div className="bg-white rounded-lg shadow-md p-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingresar Código:
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Ej: ART001"
                />
              </div>
              <button
                onClick={buscarArticulo}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Search className="h-5 w-5" />
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {articuloEncontrado && precios && (
            <>
              {/* Información del Artículo */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h3 className="text-base font-semibold text-green-800 mb-2">Información del Artículo</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-green-700">Precio Sugerido:</span>
                    <p className="text-xl font-bold text-green-900">
                      {formatearPrecio(articuloEncontrado.sugerido)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700">Descripción:</span>
                    <p className="text-base text-green-900">{articuloEncontrado.descripcion}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-green-700">Origen:</span>
                    <p className="text-base text-green-900">{articuloEncontrado.origen}</p>
                  </div>
                </div>
              </div>

              {/* Precios Base */}
              <div className="bg-white rounded-lg shadow-md p-3">
                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Precios Base
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Precio Lista S/IVA</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatearPrecio(precios.precioListaSinIva)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Precio Lista Con IVA</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatearPrecio(precios.precioListaConIva)}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-600">
                      Costo Neto Con IVA <span className="text-xs">(-{descuentos.descuento1Eseka}%)</span>
                    </p>
                    <p className="text-xl font-bold text-blue-900">
                      {formatearPrecio(precios.costoNetoConIva)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Precio Revendedores Mayorista</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatearPrecio(precios.precioRevendedoresMayorista)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Precios de Venta Local */}
              <div className="bg-white rounded-lg shadow-md p-3">
                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Precios de Venta Local
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-orange-600">Precio Venta Local 1.5x</p>
                    <p className="text-xl font-bold text-orange-900">
                      {formatearPrecio(precios.precioVentaLocal15)}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      {formatearPorcentaje(precios.variacion15)} vs Costo Neto
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-orange-600">Precio Venta Local 1.6x</p>
                    <p className="text-xl font-bold text-orange-900">
                      {formatearPrecio(precios.precioVentaLocal16)}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      {formatearPorcentaje(precios.variacion16)} vs Costo Neto
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                    <p className="text-sm font-medium text-green-600">
                      Precio Venta Local 1.7x <span className="font-bold">(Sugerido Local)</span>
                    </p>
                    <p className="text-xl font-bold text-green-900">
                      {formatearPrecio(precios.precioVentaLocal17)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {formatearPorcentaje(precios.variacion17)} vs Costo Neto
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-orange-600">Precio Venta Local 1.8x</p>
                    <p className="text-xl font-bold text-orange-900">
                      {formatearPrecio(precios.precioVentaLocal18)}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      {formatearPorcentaje(precios.variacion18)} vs Costo Neto
                    </p>
                  </div>
                </div>
              </div>

              {/* Promociones */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h3 className="text-base font-semibold text-purple-900 mb-2">Fórmulas de Promociones</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-600">Promo 2x1</p>
                    <p className="text-xl font-bold text-purple-900">
                      {formatearPrecio(precios.promo2x1)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Costo Neto Con IVA × 2</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-600">Promo 3x1</p>
                    <p className="text-xl font-bold text-purple-900">
                      {formatearPrecio(precios.promo3x1)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Costo Neto Con IVA × 3</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-600">Precio Cada Uno</p>
                    <p className="text-xl font-bold text-purple-900">
                      {formatearPrecio(precios.precioCadaUno)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Precio Venta Local 1.8x</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {codigo && !articuloEncontrado && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-red-800">
                No se encontró ningún artículo con el código "{codigo}". 
                Verifique que el código sea correcto.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConsultaPrecios;