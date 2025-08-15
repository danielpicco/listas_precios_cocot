import React from 'react';
import { FileSpreadsheet, Calculator, Search, List, BarChart3, Grid3X3 } from 'lucide-react';

interface NavBarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({ activeModule, onModuleChange }) => {
  const modules = [
    { id: 'inicio', name: 'Inicio', icon: FileSpreadsheet },
    { id: 'descuentos', name: 'Descuentos e Impuestos', icon: Calculator },
    { id: 'consulta', name: 'Consulta de Precios', icon: Search },
    { id: 'mayoristas', name: 'Lista Mayoristas', icon: List },
    { id: 'comparativo', name: 'Comparativo Precios', icon: BarChart3 },
    { id: 'mallas', name: 'Módulo Mallas', icon: Grid3X3 }
  ];

  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-8 w-8 text-white" />
            <h1 className="text-xl font-bold text-white">Sistema de Listas de Precios</h1>
          </div>
        </div>
        
        <div className="flex space-x-1 pb-4 overflow-x-auto">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => onModuleChange(module.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeModule === module.id
                    ? 'bg-white text-blue-800 shadow-md'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{module.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;