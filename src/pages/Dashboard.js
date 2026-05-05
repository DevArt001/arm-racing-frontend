import React, { useEffect, useState } from 'react';
import { getOrdenesActivas, getOrdenesUrgentes, getFacturasPendientes, getResumenContable, getBajoStock } from '../services/api';

export default function Dashboard() {
  const [ordenesActivas, setOrdenesActivas]   = useState([]);
  const [urgentes, setUrgentes]               = useState([]);
  const [facturasPend, setFacturasPend]       = useState([]);
  const [resumen, setResumen]                 = useState({ ingresos: 0, gastos: 0, utilidad: 0 });
  const [bajoStock, setBajoStock]             = useState([]);

  useEffect(() => {
    getOrdenesActivas().then(r => setOrdenesActivas(r.data.results || r.data));
    getOrdenesUrgentes().then(r => setUrgentes(r.data.results || r.data));
    getFacturasPendientes().then(r => setFacturasPend(r.data.results || r.data));
    getResumenContable().then(r => setResumen(r.data));
    getBajoStock().then(r => setBajoStock(r.data.results || r.data));
  }, []);

  const formatPeso = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#e63946', margin: 0 }}>
          🏎️ ARM Racing Performance
        </h1>
        <p style={{ color: '#888', margin: '4px 0 0' }}>Panel de control</p>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <Tarjeta titulo="Órdenes activas"   valor={ordenesActivas.length} color="#e63946" icono="🔧" />
        <Tarjeta titulo="Urgentes"          valor={urgentes.length}       color="#ff6b35" icono="⚡" />
        <Tarjeta titulo="Facturas pendientes" valor={facturasPend.length} color="#f4a261" icono="💰" />
        <Tarjeta titulo="Ingresos"          valor={formatPeso(resumen.ingresos)} color="#2a9d8f" icono="📈" />
        <Tarjeta titulo="Gastos"            valor={formatPeso(resumen.gastos)}   color="#e76f51" icono="📉" />
        <Tarjeta titulo="Utilidad"          valor={formatPeso(resumen.utilidad)} color="#457b9d" icono="✅" />
      </div>

      {/* Órdenes activas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Seccion titulo="🔧 Órdenes activas">
          {ordenesActivas.length === 0 ? <Vacio /> : ordenesActivas.slice(0, 8).map(o => (
            <FilaOrden key={o.id} orden={o} />
          ))}
        </Seccion>

        <Seccion titulo="⚡ Urgentes">
          {urgentes.length === 0
            ? <p style={{ color: '#888', fontSize: '14px' }}>Sin órdenes urgentes 🎉</p>
            : urgentes.map(o => <FilaOrden key={o.id} orden={o} />)
          }
        </Seccion>

        <Seccion titulo="💰 Facturas pendientes">
          {facturasPend.length === 0 ? <Vacio /> : facturasPend.slice(0, 6).map(f => (
            <div key={f.id} style={estiloFila}>
              <span style={{ fontWeight: 500 }}>{f.numero}</span>
              <span style={{ color: '#888', fontSize: '13px' }}>{f.cliente_nombre}</span>
              <span style={{ color: '#e63946', fontWeight: 600 }}>{formatPeso(f.total)}</span>
            </div>
          ))}
        </Seccion>

        <Seccion titulo="📦 Productos bajo stock">
          {bajoStock.length === 0
            ? <p style={{ color: '#2a9d8f', fontSize: '14px' }}>Todo el inventario OK ✅</p>
            : bajoStock.map(p => (
              <div key={p.id} style={estiloFila}>
                <span style={{ fontWeight: 500 }}>{p.nombre}</span>
                <span style={{ color: '#e63946', fontWeight: 600 }}>Stock: {p.stock}</span>
              </div>
            ))
          }
        </Seccion>
      </div>
    </div>
  );
}

// ── Componentes auxiliares ──────────────────

function Tarjeta({ titulo, valor, color, icono }) {
  return (
    <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '20px', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icono}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: color }}>{valor}</div>
      <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>{titulo}</div>
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '20px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '16px', marginTop: 0 }}>{titulo}</h3>
      {children}
    </div>
  );
}

function FilaOrden({ orden }) {
  const colores = { recibido: '#457b9d', en_proceso: '#2a9d8f', pausado: '#f4a261', urgente: '#e63946', terminado: '#888' };
  const color = colores[orden.estado] || '#888';
  return (
    <div style={estiloFila}>
      <span style={{ fontWeight: 600, color: '#e63946' }}>{orden.numero}</span>
      <span style={{ color: '#ccc', fontSize: '13px' }}>{orden.vehiculo_placa}</span>
      <span style={{ fontSize: '12px', background: color, color: '#fff', padding: '2px 8px', borderRadius: '20px' }}>{orden.estado}</span>
    </div>
  );
}

function Vacio() {
  return <p style={{ color: '#888', fontSize: '14px' }}>Sin registros</p>;
}

const estiloFila = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '8px 0', borderBottom: '1px solid #2a2a3e', fontSize: '14px', color: '#fff'
};