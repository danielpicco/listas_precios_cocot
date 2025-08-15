import React from 'react';
import { FileSpreadsheet, Calculator, Search, List, BarChart3, Grid3X3, LogOut } from 'lucide-react';

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
    { id: 'mallas', name: 'Módulo Mallas', icon: Grid3X3 },
  ];

  return (
    <nav className="bg-blue-600 text-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Marca / Título */}
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span className="font-semibold">Sistema de Gestión de Listas de Precios</span>
          </div>

          {/* Botones de módulos */}
          <div className="flex items-center gap-2">
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = module.id === activeModule;
              return (
                <button
                  key={module.id}
                  onClick={() => onModuleChange(module.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive ? 'bg-white text-blue-700' : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{module.name}</span>
                </button>
              );
            })}
          </div>

          {/* Botón Salir */}
          <div className="flex items-center">
            <button
              onClick={() => { try { localStorage.clear(); } catch {} window.location.reload(); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm"
              title="Salir (limpia datos locales y recarga)"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;