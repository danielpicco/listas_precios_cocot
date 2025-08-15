import React, { useState, useEffect } from 'react';
import { ListaPrecios, DescuentosImpuestos } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import NavBar from './components/NavBar';
import Inicio from './components/modules/Inicio';
import DescuentosImpuestosModule from './components/modules/DescuentosImpuestos';
import ConsultaPrecios from './components/modules/ConsultaPrecios';
import ListaMayoristas from './components/modules/ListaMayoristas';
import ComparativoPrecios from './components/modules/ComparativoPrecios';

function App() {
  const [activeModule, setActiveModule] = useState('inicio');

  // Estados persistentes
  const [listaActual, setListaActual] = useLocalStorage<ListaPrecios | null>('listaActual', null);
  const [listasAnteriores, setListasAnteriores] = useLocalStorage<ListaPrecios[]>('listasAnteriores', []);
  const [descuentos, setDescuentos] = useLocalStorage<DescuentosImpuestos>('descuentos', {
    iva: 21.00,
    descuento1Eseka: 15.00,
    descuento2Catalogo: 25.00,
    descuento3Mayorista: 35.00
  });

    // Intentar cargar listas desde el backend (Netlify Functions + Blobs)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/.netlify/functions/get-lists');
        if (res.ok) {
          const { latest, anteriores } = await res.json();
          if (latest) {
            setListaActual(latest);
            if (Array.isArray(anteriores)) {
              setListasAnteriores(anteriores.filter(Boolean));
            }
            return; // Ya cargamos desde backend
          }
        }
      } catch (e) {
        console.warn('Backend no disponible, usando listas.json', e);
      }
      // Fallback a /listas.json si no hay backend o no hay listas guardadas
      if (!listaActual) {
        fetch('/listas.json')
          .then(res => res.json())
          .then((data: ListaPrecios) => setListaActual(data))
          .catch(err => console.error('Error cargando listas.json', err));
      }
    })();
  }, []);


  const handleListaActualizada = (nuevaLista: ListaPrecios) => {
    if (listaActual) {
      setListasAnteriores(prev => [listaActual, ...prev].slice(0, 10)); // Mantener solo las últimas 10
    }
    setListaActual(nuevaLista);
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'inicio':
        return (
          <Inicio 
            onListaActualizada={handleListaActualizada}
            listaActual={listaActual}
          />
        );
      case 'descuentos':
        return (
          <DescuentosImpuestosModule 
            descuentos={descuentos}
            onDescuentosChange={setDescuentos}
          />
        );
      case 'consulta':
        return (
          <ConsultaPrecios 
            listaActual={listaActual}
            descuentos={descuentos}
          />
        );
      case 'mayoristas':
        return (
          <ListaMayoristas 
            listaActual={listaActual}
            descuentos={descuentos}
          />
        );
      case 'comparativo':
        return (
          <ComparativoPrecios 
            listaActual={listaActual}
            listasAnteriores={listasAnteriores}
          />
        );
      case 'mallas':
        const listaMallas = listaActual?.tipo === 'mallas' ? listaActual : null;
        const listasAnterioresMallas = listasAnteriores.filter(l => l.tipo === 'mallas');

        return (
          <div className="space-y-8">
            <div className="text-center bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-3xl font-bold text-purple-900 mb-2">Módulo Mallas</h2>
              <p className="text-lg text-purple-700">
                Gestión específica para artículos de mallas con las mismas funcionalidades
              </p>
            </div>
            <ConsultaPrecios 
              listaActual={listaMallas}
              descuentos={descuentos}
            />
          </div>
        );
      default:
        return <div>Módulo no encontrado</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar 
        activeModule={activeModule} 
        onModuleChange={setActiveModule} 
      />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderActiveModule()}
      </main>
    </div>
  );
}

export default App;