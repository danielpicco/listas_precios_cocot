import React, { useState, useEffect } from 'react';
import { ListaPrecios, DescuentosImpuestos } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import NavBar from './components/NavBar';
import Inicio from './components/modules/Inicio';
import DescuentosImpuestosModule from './components/modules/DescuentosImpuestos';
import ConsultaPrecios from './components/modules/ConsultaPrecios';
import ListaMayoristas from './components/modules/ListaMayoristas';
import ComparativoPrecios from './components/modules/ComparativoPrecios';

/** Normaliza una lista para garantizar items: [] y evitar TypeError en el render */
function normalizeLista(l: any): ListaPrecios | null {
  if (!l) return null;

  const arr = (v: unknown) => (Array.isArray(v) ? (v as any[]) : []);

  // Unificamos nombres: muchos módulos usan "articulos"
  const articulos = arr(l.articulos ?? l.items ?? l.itemsLinea);

  return {
    ...l,
    articulos,          // <- siempre array
    items: articulos,   // <- alias para quienes usan "items"
    itemsLinea:  arr(l.itemsLinea),
    itemsMallas: arr(l.itemsMallas),
  } as ListaPrecios;
}

function App() {
  const [activeModule, setActiveModule] = useState<
    'inicio' | 'consulta' | 'mayoristas' | 'comparativo' | 'descuentos'
  >('inicio');

  // Estados persistentes
  const [listaActual, setListaActual] = useLocalStorage<ListaPrecios | null>('listaActual', null);
  const [listasAnteriores, setListasAnteriores] = useLocalStorage<ListaPrecios[]>('listasAnteriores', []);
  const [descuentos, setDescuentos] = useLocalStorage<DescuentosImpuestos>('descuentos', {
    iva: 21.0,
    descuento1Eseka: 15.0,
    descuento2Catalogo: 25.0,
    descuento3Mayorista: 35.0,
  });

  // Intentar cargar listas desde el backend (Netlify Functions)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/.netlify/functions/get-lists');
        if (!res.ok) {
          console.warn('get-lists respondió', res.status);
          return;
        }

        const data = (await res.json()) as {
          latest?: ListaPrecios | null;
          anteriores?: ListaPrecios[] | null;
        };

        // Normalización defensiva
        const latestN = normalizeLista(data?.latest ?? null);
        const anterioresN = Array.isArray(data?.anteriores)
          ? (data.anteriores.map(normalizeLista).filter(Boolean) as ListaPrecios[])
          : [];

        if (latestN) setListaActual(latestN);
        setListasAnteriores(anterioresN);
      } catch (err) {
        console.error('Error cargando listas desde función get-lists', err);
      }
    })();
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const handleListaActualizada = (nueva: ListaPrecios) => {
    if (listaActual) {
      const prevNorm = normalizeLista(listaActual)!;
      setListasAnteriores((prev) => [prevNorm, ...(prev ?? [])]);
    }
    setListaActual(normalizeLista(nueva));
  };

  const handleDescuentosActualizados = (nuevos: DescuentosImpuestos) => {
    setDescuentos(nuevos);
  };

  // Derivados SEGUROS para pasar a niños (evita .length de undefined)
  const listaActualSafe =
    normalizeLista(listaActual) ?? ({ items: [] } as unknown as ListaPrecios);

  const listasAnterioresSafe: ListaPrecios[] = Array.isArray(listasAnteriores)
    ? (listasAnteriores.map(normalizeLista).filter(Boolean) as ListaPrecios[])
    : [];

  // Render del módulo activo
  const renderActiveModule = () => {
    switch (activeModule) {
      case 'inicio':
        return (
          <Inicio
            listaActual={listaActualSafe}
            onListaActualizada={handleListaActualizada}
          />
        );
      case 'descuentos':
        return (
          <DescuentosImpuestosModule
            descuentos={descuentos}
            onChange={handleDescuentosActualizados}
          />
        );
      case 'consulta':
        return (
          <ConsultaPrecios
            listaActual={listaActualSafe}
            descuentos={descuentos}
          />
        );
      case 'mayoristas':
        return (
          <ListaMayoristas
            listaActual={listaActualSafe}
            descuentos={descuentos}
          />
        );
      case 'comparativo':
        return (
          <ComparativoPrecios
            listaActual={listaActualSafe}
            listasAnteriores={listasAnterioresSafe}
          />
        );
      default:
        return <div>Módulo no encontrado</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar activeModule={activeModule} onModuleChange={setActiveModule} />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderActiveModule()}
      </main>
    </div>
  );
}

export default App;