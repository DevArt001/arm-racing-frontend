import React, { useEffect, useState } from 'react';
import { getFacturas, crearFactura, getClientes } from '../services/api';
import axios from 'axios';

const campoVacio = {
  cliente: '', orden: '', estado: 'pendiente', metodo_pago: 'efectivo',
  subtotal: 0, descuento_total: 0, impuesto: 0, total: 0,
  total_pagado: 0, notas: '',
};

const coloresEstado = {
  pendiente: '#f4a261', parcial: '#4fc3f7', pagada: '#2a9d8f', anulada: '#e63946',
};

export default function Facturas() {
  const [facturas, setFacturas]   = useState([]);
  const [clientes, setClientes]   = useState([]);
  const [ordenes, setOrdenes]     = useState([]);
  const [busqueda, setBusqueda]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [modal, setModal]         = useState(false);
  const [detalle, setDetalle]     = useState(null);
  const [form, setForm]           = useState(campoVacio);
  const [cargando, setCargando]   = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [modalPago, setModalPago] = useState(null);
  const [pago, setPago]           = useState({ monto: 0, metodo: 'efectivo', referencia: '', notas: '' });

  const formatPeso = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

  const cargar = () => {
    getFacturas().then(r => setFacturas(r.data.results || r.data));
    getClientes().then(r => setClientes(r.data.results || r.data));
    axios.get('http://127.0.0.1:8000/api/ordenes/').then(r => setOrdenes(r.data.results || r.data));
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = facturas.filter(f => {
    const texto = `${f.numero} ${f.cliente_nombre}`.toLowerCase().includes(busqueda.toLowerCase());
    const estado = filtroEstado === 'todos' || f.estado === filtroEstado;
    return texto && estado;
  });

  const calcularTotal = (f) => {
    const sub  = parseFloat(f.subtotal) || 0;
    const desc = parseFloat(f.descuento_total) || 0;
    const imp  = parseFloat(f.impuesto) || 0;
    return sub - desc + imp;
  };

  const guardar = async () => {
    if (!form.cliente) { alert('Selecciona un cliente'); return; }
    setCargando(true);
    try {
      const datos = { ...form, total: calcularTotal(form), orden: form.orden || null };
      await crearFactura(datos);
      setModal(false); setForm(campoVacio); cargar();
    } catch (e) { alert('Error: ' + JSON.stringify(e.response?.data)); }
    setCargando(false);
  };

  const eliminar = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/facturas/${id}/`);
      setConfirmEliminar(null); cargar();
    } catch (e) { alert('No se puede eliminar esta factura'); }
  };

  const registrarPago = async () => {
    if (!pago.monto || pago.monto <= 0) { alert('Ingresa un monto válido'); return; }
    try {
      await axios.post('http://127.0.0.1:8000/api/pagos/', { ...pago, factura: modalPago.id });
      // Actualizar total pagado
      const nuevoPagado = parseFloat(modalPago.total_pagado) + parseFloat(pago.monto);
      const nuevoEstado = nuevoPagado >= parseFloat(modalPago.total) ? 'pagada' : 'parcial';
      await axios.patch(`http://127.0.0.1:8000/api/facturas/${modalPago.id}/`, {
        total_pagado: nuevoPagado, estado: nuevoEstado,
      });
      setModalPago(null);
      setPago({ monto: 0, metodo: 'efectivo', referencia: '', notas: '' });
      cargar();
    } catch (e) { alert('Error al registrar pago'); }
  };

  const estados = ['todos', 'pendiente', 'parcial', 'pagada', 'anulada'];

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🧾 Facturas</h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '13px' }}>{facturas.length} facturas en total</p>
        </div>
        <button onClick={() => { setForm(campoVacio); setModal(true); }} style={btnPrimario}>+ Nueva factura</button>
      </div>

      {/* Resumen rápido */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Pendientes', estado: 'pendiente', color: '#f4a261' },
          { label: 'Pago parcial', estado: 'parcial', color: '#4fc3f7' },
          { label: 'Pagadas', estado: 'pagada', color: '#2a9d8f' },
          { label: 'Anuladas', estado: 'anulada', color: '#e63946' },
        ].map(item => (
          <div key={item.estado} style={{ background: '#1a1a2e', borderRadius: '10px', padding: '16px', borderLeft: `3px solid ${item.color}` }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: item.color }}>
              {facturas.filter(f => f.estado === item.estado).length}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Buscar por número o cliente..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ ...estiloInput, flex: 1 }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          {estados.map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{
              border: 'none', padding: '8px 14px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '12px', fontWeight: 500,
              background: filtroEstado === e ? (coloresEstado[e] || '#e63946') : '#1a1a2e',
              color: filtroEstado === e ? '#fff' : '#888',
            }}>
              {e === 'todos' ? 'Todas' : e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#0d0d1a', color: '#888' }}>
              {['Número', 'Cliente', 'Estado', 'Total', 'Pagado', 'Saldo', 'Método', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Sin facturas</td></tr>
            ) : filtrados.map(f => (
              <tr key={f.id} style={{ borderTop: '1px solid #2a2a3e' }}
                onMouseEnter={e => e.currentTarget.style.background = '#151528'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#e63946' }}>{f.numero}</td>
                <td style={{ padding: '12px 16px' }}>{f.cliente_nombre}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                    background: coloresEstado[f.estado] + '33',
                    color: coloresEstado[f.estado], fontWeight: 600,
                  }}>{f.estado}</span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{formatPeso(f.total)}</td>
                <td style={{ padding: '12px 16px', color: '#2a9d8f' }}>{formatPeso(f.total_pagado)}</td>
                <td style={{ padding: '12px 16px', color: f.saldo_pendiente > 0 ? '#f4a261' : '#2a9d8f', fontWeight: 600 }}>
                  {formatPeso(f.saldo_pendiente)}
                </td>
                <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '13px' }}>{f.metodo_pago || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setDetalle(f)} style={btnVer}>👁️</button>
                    {f.estado !== 'pagada' && f.estado !== 'anulada' && (
                      <button onClick={() => setModalPago(f)} style={btnPagar}>💳</button>
                    )}
                    <button onClick={() => setConfirmEliminar(f)} style={btnEliminar}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nueva factura */}
      {modal && (
        <div style={estiloOverlay}>
          <div style={estiloModal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>+ Nueva factura</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Campo label="Cliente *" full>
                <select value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} style={estiloSelect}>
                  <option value="">Selecciona un cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                </select>
              </Campo>
              <Campo label="Orden de trabajo (opcional)" full>
                <select value={form.orden} onChange={e => setForm({ ...form, orden: e.target.value })} style={estiloSelect}>
                  <option value="">Sin orden asociada</option>
                  {ordenes.map(o => <option key={o.id} value={o.id}>{o.numero} — {o.vehiculo_placa}</option>)}
                </select>
              </Campo>
              <Campo label="Subtotal">
                <input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Descuento">
                <input type="number" value={form.descuento_total} onChange={e => setForm({ ...form, descuento_total: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Impuesto">
                <input type="number" value={form.impuesto} onChange={e => setForm({ ...form, impuesto: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Método de pago">
                <select value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })} style={estiloSelect}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="nequi">Nequi</option>
                  <option value="daviplata">Daviplata</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="credito">Crédito / fiado</option>
                </select>
              </Campo>
              <Campo label="Total calculado" full>
                <div style={{ padding: '10px 12px', background: '#0a0a1a', borderRadius: '6px', fontSize: '18px', fontWeight: 700, color: '#e63946' }}>
                  {formatPeso(calcularTotal(form))}
                </div>
              </Campo>
              <Campo label="Notas" full>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} style={{ ...estiloInputModal, height: '60px', resize: 'vertical' }} />
              </Campo>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={btnSecundario}>Cancelar</button>
              <button onClick={guardar} disabled={cargando} style={btnPrimario}>
                {cargando ? 'Guardando...' : 'Crear factura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal registrar pago */}
      {modalPago && (
        <div style={estiloOverlay}>
          <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '28px', width: '450px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>💳 Registrar pago</h2>
              <button onClick={() => setModalPago(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: '#0f0f23', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ color: '#888' }}>Factura: <span style={{ color: '#e63946', fontWeight: 700 }}>{modalPago.numero}</span></div>
              <div style={{ color: '#888' }}>Total: <span style={{ color: '#fff', fontWeight: 600 }}>{formatPeso(modalPago.total)}</span></div>
              <div style={{ color: '#888' }}>Pagado: <span style={{ color: '#2a9d8f', fontWeight: 600 }}>{formatPeso(modalPago.total_pagado)}</span></div>
              <div style={{ color: '#888' }}>Saldo: <span style={{ color: '#f4a261', fontWeight: 600 }}>{formatPeso(modalPago.saldo_pendiente)}</span></div>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <Campo label="Monto a pagar *">
                <input type="number" value={pago.monto} onChange={e => setPago({ ...pago, monto: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Método de pago">
                <select value={pago.metodo} onChange={e => setPago({ ...pago, metodo: e.target.value })} style={estiloSelect}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="nequi">Nequi</option>
                  <option value="daviplata">Daviplata</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </Campo>
              <Campo label="Referencia / comprobante">
                <input value={pago.referencia} onChange={e => setPago({ ...pago, referencia: e.target.value })} style={estiloInputModal} placeholder="Número de transferencia..." />
              </Campo>
              <Campo label="Notas">
                <input value={pago.notas} onChange={e => setPago({ ...pago, notas: e.target.value })} style={estiloInputModal} />
              </Campo>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalPago(null)} style={btnSecundario}>Cancelar</button>
              <button onClick={registrarPago} style={btnPrimario}>Registrar pago</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div style={estiloOverlay}>
          <div style={{ ...estiloModal, width: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#e63946' }}>{detalle.numero}</h2>
              <button onClick={() => setDetalle(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <Info label="Cliente"    valor={detalle.cliente_nombre} />
              <Info label="Estado"     valor={detalle.estado} color={coloresEstado[detalle.estado]} />
              <Info label="Subtotal"   valor={formatPeso(detalle.subtotal)} />
              <Info label="Descuento"  valor={formatPeso(detalle.descuento_total)} />
              <Info label="Impuesto"   valor={formatPeso(detalle.impuesto)} />
              <Info label="Total"      valor={formatPeso(detalle.total)} color="#e63946" />
              <Info label="Pagado"     valor={formatPeso(detalle.total_pagado)} color="#2a9d8f" />
              <Info label="Saldo"      valor={formatPeso(detalle.saldo_pendiente)} color="#f4a261" />
              <Info label="Método"     valor={detalle.metodo_pago || '—'} />
              <Info label="Fecha"      valor={detalle.creado_en ? new Date(detalle.creado_en).toLocaleDateString('es-CO') : '—'} />
            </div>
            {detalle.pagos?.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>PAGOS REGISTRADOS</div>
                {detalle.pagos.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #2a2a3e', fontSize: '13px' }}>
                    <span style={{ color: '#aaa' }}>{p.metodo}</span>
                    <span style={{ color: '#2a9d8f', fontWeight: 600 }}>{formatPeso(p.monto)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {detalle.estado !== 'pagada' && (
                <button onClick={() => { setDetalle(null); setModalPago(detalle); }} style={btnPagar}>💳 Registrar pago</button>
              )}
              <button onClick={() => setDetalle(null)} style={btnSecundario}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div style={estiloOverlay}>
          <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '28px', width: '400px', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px' }}>¿Eliminar factura?</h3>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px' }}>
              <strong style={{ color: '#e63946' }}>{confirmEliminar.numero}</strong><br />
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmEliminar(null)} style={btnSecundario}>Cancelar</button>
              <button onClick={() => eliminar(confirmEliminar.id)} style={btnPrimario}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? 'span 2' : 'span 1' }}>
      <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>{label}</label>
      {children}
    </div>
  );
}

function Info({ label, valor, color }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 500, color: color || '#fff' }}>{valor}</div>
    </div>
  );
}

const btnPrimario    = { background: '#e63946', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' };
const btnSecundario  = { background: '#2a2a3e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' };
const btnVer         = { background: '#1e3a2f', color: '#81c784', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnPagar       = { background: '#1e3a5f', color: '#4fc3f7', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnEliminar    = { background: '#3a1e1e', color: '#e63946', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const estiloInput    = { padding: '10px 14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' };
const estiloInputModal = { width: '100%', padding: '8px 12px', background: '#0f0f23', border: '1px solid #2a2a3e', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' };
const estiloSelect   = { ...estiloInputModal, cursor: 'pointer' };
const estiloOverlay  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const estiloModal    = { background: '#1a1a2e', borderRadius: '16px', padding: '28px', width: '580px', maxHeight: '90vh', overflowY: 'auto', color: '#fff' };