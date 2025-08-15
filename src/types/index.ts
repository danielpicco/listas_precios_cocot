export interface Articulo {
  codigo: string;
  descripcion: string;
  color: string;
  talle: string;
  unidad: number;
  sugerido: number;
  origen: string;
}

export interface DescuentosImpuestos {
  iva: number;
  descuento1Eseka: number;
  descuento2Catalogo: number;
  descuento3Mayorista: number;
}

export interface PreciosCalculados {
  precioListaSinIva: number;
  precioListaConIva: number;
  costoNetoConIva: number;
  precioRevendedoresMayorista: number;
  precioMayorista: number;
  precioVentaLocal15: number;
  precioVentaLocal16: number;
  precioVentaLocal17: number;
  precioVentaLocal18: number;
  variacion15: number;
  variacion16: number;
  variacion17: number;
  variacion18: number;
  promo2x1: number;
  promo3x1: number;
  precioCadaUno: number;
}

export interface ListaPrecios {
  id: string;
  nombre: string;
  nombreLista: string; // Nuevo campo con el nombre original del archivo
  fecha: Date;
  articulos: Articulo[];
  tipo: 'linea' | 'mallas';
}

export interface ComparativoItem {
  codigo: string;
  descripcion: string;
  precioActual: number;
  precioAnterior: number;
  incremento: number;
  porcentajeIncremento: number;
}
