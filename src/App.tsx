import React, { useEffect, useState } from 'react';
import { ListaPrecios, DescuentosImpuestos } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

import NavBar from './components/NavBar';
import Inicio from './components/modules/Inicio';
import DescuentosImpuestosModule from './components/modules/DescuentosImpuestos';
import ConsultaPrecios from './components/modules/ConsultaPrecios';
import ListaMayoristas from './components/modules/ListaMayoristas';
import ComparativoPrecios from './components/modules/ComparativoPrecios';
import ErrorBoundary from './components/ErrorBoundary';

/** Normaliza: garantiza arrays y alinea la fecha (vigenteDesde → fecha) */
function normalizeLista(l: any): ListaPrecios | null {
  if (!l) return null;
  const arr = (v: unknown) => (Array.isArray(v) ? (v as any[]) : []);

  // unificamos artículos para todos los módulos
  const articulos = arr(l.articulos ?? l.items ?? l.itemsLinea);

  // unificamos fecha (backend devuelve vigenteDesde)
  const rawFecha =
    l.fecha ?? l.vigenteDesde ?? l.vigente_desde ?? l.createdAt ?? l.created_at ?? null;
  const fechaValida =
    rawFecha && !isNaN(new Date(rawFecha as string).getTime()) ? (rawFecha as string) : null;

  return {
    ...l,
    articulos,        // módulos que leen listaActual.articulos
    items: articulos, // módulos que leen listaActual.items
    itemsLinea:  arr(l.itemsLinea),
    itemsMallas: arr(l.itemsMallas),
    fecha: fechaValida, // módulos que leen listaActual.fecha
  } as ListaPrecios;
}

type ModKey = 'inicio' | 'consulta' | 'mayoristas' | 'comparativo' | 'descuentos';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModKey>('inicio');

  const [listaActual, setListaActual] = useLocalStorage<ListaPrecios | null>('listaActual', null);
  const [listasAnteriores, setListasAnteriores] = useLocalStorage<ListaPrecios[]>(
    'listasAnteriores',
    []
  );
  const [descuentos, setDescuentos] = useLocalStorage<DescuentosImpuestos>('descuentos', {
    iva: 21.0,
    descuento1Eseka: 15.0,
    descuento2Catalogo: 25.0,
    descuento3Mayorista: 35.0,
  });

  // Carga inicial desde Netlify Functions (sin cache en cliente)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/.netlify/functions/get-lists?ts=' + Date.now(), {
          cache: 'no-store',
        });
        if (!res.ok) {
          console.warn('get-lists respondió', res.status);
          return;
        }
        const data = (await res.json()) as {
          latest?: ListaPrecios | null;
          anteriores?: ListaPrecios[] | null;
        };

        // normalizamos para que nunca haya .length/.map sobre undefined
        const latestN = normalizeLista(data?.latest ?? null);
        const anterioresN = Array.isArray(data?.anteriores)
          ? (data.anteriores.map(normalizeLista).filter(Boolean) as ListaPrecios[])
          : [];

        if (latestN) setListaActual(latestN);
        setListasAnteriores(anterioresN);
      } catch (err) {
        console.error('Error cargando listas desde get-lists', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handlers
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

  // Derivados SEGUROS para pasar a los módulos
  const listaActualSafe =
    normalizeLista(listaActual) ?? ({ items: [] } as unknown as ListaPrecios);

  const listasAnterioresSafe: ListaPrecios[] = Array.isArray(listasAnteriores)
    ? (listasAnteriores.map(normalizeLista).filter(Boolean) as ListaPrecios[])
    : [];

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
        <ErrorBoundary>
          {renderActiveModule()}
        </ErrorBoundary>
      </main>
    </div>
  );
}
