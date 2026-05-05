import React, { useState } from 'react';

const menu = [
  { seccion: 'PRINCIPAL' },
  { icono: '📊', label: 'Dashboard',        path: '/' },
  { seccion: 'TALLER' },
  { icono: '👤', label: 'Clientes',          path: '/clientes' },
  { icono: '🚗', label: 'Vehículos',         path: '/vehiculos' },
  { icono: '🔧', label: 'Órdenes de trabajo',path: '/ordenes' },
  { icono: '🔩', label: 'Agrandamientos',    path: '/agrandamientos' },
  { seccion: 'VENTAS' },
  { icono: '📄', label: 'Cotizaciones',      path: '/cotizaciones' },
  { icono: '🧾', label: 'Facturas',          path: '/facturas' },
  { icono: '🛒', label: 'Productos',         path: '/productos' },
  { icono: '🎁', label: 'Promociones',       path: '/promociones' },
  { seccion: 'CONTABILIDAD' },
  { icono: '💰', label: 'Transacciones',     path: '/transacciones' },
  { icono: '📈', label: 'Reportes',          path: '/reportes' },
  { seccion: 'COMUNICACIONES' },
  { icono: '🔔', label: 'Recordatorios',     path: '/recordatorios' },
  { icono: '📞', label: 'Llamadas',          path: '/llamadas' },
  { seccion: 'MARKETING' },
  { icono: '📱', label: 'Campañas',          path: '/campanas' },
  { icono: '🤖', label: 'Servicios',         path: '/servicios' },
  { seccion: 'SISTEMA' },
  { icono: '👥', label: 'Usuarios',          path: '/usuarios' },
];

export default function Sidebar({ paginaActual, onNavegar }) {
  const [colapsado, setColapsado] = useState(false);

  return (
    <div style={{
      width: colapsado ? '60px' : '240px',
      minHeight: '100vh',
      background: '#0d0d1a',
      borderRight: '1px solid #1e1e3a',
      transition: 'width 0.25s ease',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      zIndex: 100,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid #1e1e3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '64px',
      }}>
        {!colapsado && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#e63946' }}>🏎️ ARM Racing</div>
            <div style={{ fontSize: '11px', color: '#666' }}>Performance</div>
          </div>
        )}
        <button onClick={() => setColapsado(!colapsado)} style={{
          background: 'none', border: 'none', color: '#888',
          cursor: 'pointer', fontSize: '18px', padding: '4px',
          marginLeft: colapsado ? 'auto' : '0',
          marginRight: colapsado ? 'auto' : '0',
        }}>
          {colapsado ? '→' : '←'}
        </button>
      </div>

      {/* Items del menú */}
      <nav style={{ padding: '12px 0', flex: 1 }}>
        {menu.map((item, i) => {
          if (item.seccion) {
            if (colapsado) return <div key={i} style={{ height: '1px', background: '#1e1e3a', margin: '8px 0' }} />;
            return (
              <div key={i} style={{
                fontSize: '10px', fontWeight: 600, color: '#444',
                padding: '12px 16px 4px', letterSpacing: '0.1em'
              }}>
                {item.seccion}
              </div>
            );
          }

          const activo = paginaActual === item.path;
          return (
            <div key={i} onClick={() => onNavegar(item.path)} style={{
              display: 'flex', alignItems: 'center',
              gap: '10px', padding: '10px 16px',
              cursor: 'pointer', borderRadius: '6px',
              margin: '1px 8px',
              background: activo ? '#1a1a3a' : 'transparent',
              borderLeft: activo ? '3px solid #e63946' : '3px solid transparent',
              color: activo ? '#fff' : '#888',
              fontSize: '13px', fontWeight: activo ? 600 : 400,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
            onMouseEnter={e => { if (!activo) e.currentTarget.style.background = '#151528'; }}
            onMouseLeave={e => { if (!activo) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>{item.icono}</span>
              {!colapsado && <span>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!colapsado && (
        <div style={{ padding: '16px', borderTop: '1px solid #1e1e3a', fontSize: '11px', color: '#444' }}>
          ARM Racing Performance v1.0
        </div>
      )}
    </div>
  );
}