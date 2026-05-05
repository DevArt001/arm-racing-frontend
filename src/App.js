import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Vehiculos from './pages/Vehiculos';
import Ordenes from './pages/Ordenes';
import Facturas from './pages/Facturas';

const paginas = {
  '/':          <Dashboard />,
  '/clientes':  <Clientes />,
  '/vehiculos': <Vehiculos />,
  '/ordenes':   <Ordenes />,
  '/facturas':  <Facturas />,
};

export default function App() {
  const [paginaActual, setPaginaActual] = useState('/');

  return (
    <div style={{ display: 'flex', background: '#0f0f23', minHeight: '100vh' }}>
      <Sidebar paginaActual={paginaActual} onNavegar={setPaginaActual} />
      <main style={{ marginLeft: '240px', flex: 1, minHeight: '100vh' }}>
        {paginas[paginaActual] || (
          <div style={{ padding: '40px', color: '#888', fontFamily: 'Inter, sans-serif' }}>
            <h2 style={{ color: '#e63946' }}>🚧 Módulo en construcción</h2>
            <p>Este módulo estará disponible pronto.</p>
          </div>
        )}
      </main>
    </div>
  );
}

