import React, { useState } from 'react';
import { DescuentosImpuestos as DescuentosImpuestosType } from '../../types';
import { Save, Calculator } from 'lucide-react';

interface DescuentosImpuestosProps {
  descuentos: DescuentosImpuestosType;
  onDescuentosChange: (descuentos: DescuentosImpuestosType) => void;
}

const DescuentosImpuestos: React.FC<DescuentosImpuestosProps> = ({ 
  descuentos, 
  onDescuentosChange 
}) => {
  const [formData, setFormData] = useState(descuentos);
  const [guardado, setGuardado] = useState(false);

  const handleInputChange = (field: keyof DescuentosImpuestosType, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  const handleSave = () => {
    onDescuentosChange(formData);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Configuración de Descuentos e Impuestos</h2>
        <p className="text-lg text-gray-600">Configure los porcentajes para el cálculo de precios</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentaje de IVA (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.iva}
                  onChange={(e) => handleInputChange('iva', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="21.00"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Precio Lista Con IVA = Precio Lista Sin IVA + IVA
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descuento 1 - ESEKA (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.descuento1Eseka}
                  onChange={(e) => handleInputChange('descuento1Eseka', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="15.00"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Costo Neto Con IVA = Precio Lista Con IVA - Descuento ESEKA
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descuento 2 - Revendedoras Catálogo (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.descuento2Catalogo}
                  onChange={(e) => handleInputChange('descuento2Catalogo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="25.00"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descuento 3 - Mayorista (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.descuento3Mayorista}
                  onChange={(e) => handleInputChange('descuento3Mayorista', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="35.00"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calculator className="h-4 w-4" />
              <span>Los cambios se aplicarán a todos los cálculos de precios</span>
            </div>
            
            <button
              onClick={handleSave}
              className={`inline-flex items-center px-6 py-2 rounded-md text-white font-medium transition-all duration-200 ${
                guardado 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save className="h-4 w-4 mr-2" />
              {guardado ? 'Guardado' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Vista Previa de Cálculos</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Precio Lista Sin IVA:</strong> $100.00 (ejemplo)</p>
          <p><strong>Precio Lista Con IVA ({formData.iva}%):</strong> ${(100 * (1 + formData.iva / 100)).toFixed(2)}</p>
          <p><strong>Costo Neto Con IVA (menos {formData.descuento1Eseka}%):</strong> ${(100 * (1 + formData.iva / 100) * (1 - formData.descuento1Eseka / 100)).toFixed(2)}</p>
          <p><strong>Precio Revendedores (menos {formData.descuento2Catalogo}%):</strong> ${(100 * (1 + formData.iva / 100) * (1 - formData.descuento2Catalogo / 100)).toFixed(2)}</p>
          <p><strong>Precio Mayorista (menos {formData.descuento3Mayorista}%):</strong> ${(100 * (1 + formData.iva / 100) * (1 - formData.descuento3Mayorista / 100)).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default DescuentosImpuestos;