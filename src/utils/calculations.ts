import { DescuentosImpuestos, PreciosCalculados } from '../types';

export const calcularPrecios = (
  precioBase: number,
  descuentos: DescuentosImpuestos
): PreciosCalculados => {
  const precioListaSinIva = precioBase;
  const precioListaConIva = precioBase * (1 + descuentos.iva / 100);
  const costoNetoConIva = precioListaConIva * (1 - descuentos.descuento1Eseka / 100);
  
  const precioRevendedoresMayorista = precioListaConIva * (1 + descuentos.descuento2Catalogo / 100);
  const precioMayorista = precioListaConIva * (1 + descuentos.descuento3Mayorista / 100);
  
  const precioVentaLocal15 = precioListaConIva * 1.5;
  const precioVentaLocal16 = precioListaConIva * 1.6;
  const precioVentaLocal17 = precioListaConIva * 1.7;
  const precioVentaLocal18 = precioListaConIva * 1.8;
  
  const calcularVariacion = (precio: number) => ((precio - costoNetoConIva) / costoNetoConIva) * 100;
  
  const variacion15 = calcularVariacion(precioVentaLocal15);
  const variacion16 = calcularVariacion(precioVentaLocal16);
  const variacion17 = calcularVariacion(precioVentaLocal17);
  const variacion18 = calcularVariacion(precioVentaLocal18);
  
  const promo2x1 = costoNetoConIva * 2 * 2;
  const promo3x1 = costoNetoConIva * 2 * 3;
  const precioCadaUno = precioVentaLocal18;
  
  return {
    precioListaSinIva,
    precioListaConIva,
    costoNetoConIva,
    precioRevendedoresMayorista,
    precioMayorista,
    precioVentaLocal15,
    precioVentaLocal16,
    precioVentaLocal17,
    precioVentaLocal18,
    variacion15,
    variacion16,
    variacion17,
    variacion18,
    promo2x1,
    promo3x1,
    precioCadaUno
  };
};

export const calcularUtilidad = (precioVenta: number, costoNeto: number): number => {
  return ((precioVenta - costoNeto) / costoNeto) * 100;
};

export const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(precio);
};

export const formatearPorcentaje = (porcentaje: number): string => {
  return `${porcentaje.toFixed(2)}%`;
};