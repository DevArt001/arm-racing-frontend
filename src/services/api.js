import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Clientes
export const getClientes     = () => API.get('/clientes/');
export const getCliente      = (id) => API.get(`/clientes/${id}/`);
export const crearCliente    = (data) => API.post('/clientes/', data);
export const editarCliente   = (id, data) => API.put(`/clientes/${id}/`, data);
export const eliminarCliente = (id) => API.delete(`/clientes/${id}/`);
export const getHistorialCliente = (id) => API.get(`/clientes/${id}/historial/`);

// Vehículos
export const getVehiculos  = () => API.get('/vehiculos/');
export const getVehiculo   = (id) => API.get(`/vehiculos/${id}/`);
export const crearVehiculo = (data) => API.post('/vehiculos/', data);
export const editarVehiculo = (id, data) => API.put(`/vehiculos/${id}/`, data);

// Órdenes de trabajo
export const getOrdenes        = () => API.get('/ordenes/');
export const getOrden          = (id) => API.get(`/ordenes/${id}/`);
export const crearOrden        = (data) => API.post('/ordenes/', data);
export const editarOrden       = (id, data) => API.put(`/ordenes/${id}/`, data);
export const getOrdenesActivas = () => API.get('/ordenes/activas/');
export const getOrdenesUrgentes = () => API.get('/ordenes/urgentes/');

// Servicios
export const getServicios = () => API.get('/servicios/');

// Productos
export const getProductos  = () => API.get('/productos/');
export const getBajoStock  = () => API.get('/productos/bajo_stock/');

// Cotizaciones
export const getCotizaciones = () => API.get('/cotizaciones/');
export const crearCotizacion = (data) => API.post('/cotizaciones/', data);

// Facturas
export const getFacturas          = () => API.get('/facturas/');
export const getFactura           = (id) => API.get(`/facturas/${id}/`);
export const crearFactura         = (data) => API.post('/facturas/', data);
export const getFacturasPendientes = () => API.get('/facturas/pendientes/');

// Transacciones
export const getTransacciones = () => API.get('/transacciones/');
export const crearTransaccion = (data) => API.post('/transacciones/', data);
export const getResumenContable = () => API.get('/transacciones/resumen/');

// Recordatorios
export const getRecordatorios          = () => API.get('/recordatorios/');
export const crearRecordatorio         = (data) => API.post('/recordatorios/', data);
export const getRecordatoriosPendientes = () => API.get('/recordatorios/pendientes/');

export default API;