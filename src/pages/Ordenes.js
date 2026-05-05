import React, { useEffect, useState } from 'react';
import { getOrdenes, crearOrden, editarOrden, getVehiculos } from '../services/api';
import axios from 'axios';

const campoVacio = {
  vehiculo: '', tecnico: '', estado: 'recibido', prioridad: 'normal',
  km_entrada: 0, descripcion_cliente: '', diagnostico: '',
  fecha_prometida: '', observaciones_internas: '', notas_entrega: '',
};

const coloresEstado = {
  recibido: '#457b9d', diagnostico: '#9b59b6', aprobado: '#2ecc71',
  en_proceso: '#2a9d8f', pausado: '#f4a261', terminado: '#888',
  entregado: '#2ecc71', cancelado: '#e63946',
};

const coloresPrioridad = {
  baja: '#888', normal: '#4fc3f7', alta: '#f4a261', urgente: '#e63946',
};

export default function Ordenes() {
  const [ordenes, setOrdenes]             = useState([]);
  const [vehiculos, setVehiculos]         = useState([]);
  const [tecnicos, setTecnicos]           = useState([]);
  const [busqueda, setBusqueda]           = useState('');
  const [filtroEstado, setFiltroEstado]   = useState('todos');
  const [modal, setModal]                 = useState(false);
  const [editando, setEditando]           = useState(null);
  const [form, setForm]                   = useState(campoVacio);
  const [cargando, setCargando]           = useState(false);
  const [detalle, setDetalle]             = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = () => {
    getOrdenes().then(r => setOrdenes(r.data.results || r.data));
    getVehiculos().then(r => setVehiculos(r.data.results || r.data));
    axios.get('http://127.0.0.1:8000/api/usuarios/').then(r => {
      const data = r.data.results || r.data;
      setTecnicos(data.filter(u => u.rol === 'tecnico'));
    });
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = ordenes.filter(o => {
    const texto = `${o.numero} ${o.vehiculo_placa} ${o.cliente_nombre}`
      .toLowerCase().includes(busqueda.toLowerCase());
    const estado = filtroEstado === 'todos' || o.estado === filtroEstado;
    return texto && estado;
  });

  const abrirNuevo = () => { setEditando(null); setForm(campoVacio); setModal(true); };

  const abrirEditar = (o) => {
    setEditando(o.id);
    setForm({
      vehiculo: o.vehiculo, tecnico: o.tecnico || '',
      estado: o.estado, prioridad: o.prioridad,
      km_entrada: o.km_entrada, descripcion_cliente: o.descripcion_cliente,
      diagnostico: o.diagnostico || '', fecha_prometida: o.fecha_prometida || '',
      observaciones_internas: o.observaciones_internas || '',
      notas_entrega: o.notas_entrega || '',
    });
    setModal(true);
  };

  const guardar = async () => {
    if (!form.vehiculo || !form.descripcion_cliente) {
      alert('Selecciona un vehículo y describe el problema'); return;
    }
    setCargando(true);
    try {
      const datos = { ...form, tecnico: form.tecnico || null, fecha_prometida: form.fecha_prometida || null };
      if (editando) await editarOrden(editando, datos);
      else await crearOrden(datos);
      setModal(false); setForm(campoVacio); setEditando(null); cargar();
    } catch (e) { alert('Error: ' + JSON.stringify(e.response?.data)); }
    setCargando(false);
  };

  const eliminar = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/ordenes/${id}/`);
      setConfirmEliminar(null);
      cargar();
    } catch (e) {
      alert('No se puede eliminar esta orden');
    }
  };

  const estados = ['todos', 'recibido', 'diagnostico', 'aprobado', 'en_proceso', 'pausado', 'terminado', 'entregado'];

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🔧 Órdenes de trabajo</h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '13px' }}>{ordenes.length} órdenes en total</p>
        </div>
        <button onClick={abrirNuevo} style={btnPrimario}>+ Nueva orden</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Buscar por número, placa o cliente..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ ...estiloInput, flex: 1, minWidth: '200px' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {estados.map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{
              border: 'none', padding: '8px 12px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '12px', fontWeight: 500,
              background: filtroEstado === e ? (coloresEstado[e] || '#e63946') : '#1a1a2e',
              color: filtroEstado === e ? '#fff' : '#888',
            }}>
              {e === 'todos' ? 'Todos' : e.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#0d0d1a', color: '#888' }}>
              {['Número', 'Vehículo', 'Cliente', 'Estado', 'Prioridad', 'Técnico', 'Fecha entrada', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Sin órdenes</td></tr>
            ) : filtrados.map(o => (
              <tr key={o.id} style={{ borderTop: '1px solid #2a2a3e' }}
                onMouseEnter={e => e.currentTarget.style.background = '#151528'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontWeight: 700, color: '#e63946' }}>{o.numero}</span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{o.vehiculo_placa}</td>
                <td style={{ padding: '12px 16px', color: '#aaa' }}>{o.cliente_nombre}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                    background: coloresEstado[o.estado] + '33',
                    color: coloresEstado[o.estado] || '#888',
                    fontWeight: 600,
                  }}>
                    {o.estado?.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '12px', color: coloresPrioridad[o.prioridad] || '#888', fontWeight: 600 }}>
                    {o.prioridad === 'urgente' ? '⚡ ' : ''}{o.prioridad}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '13px' }}>
                  {o.tecnico_nombre || <span style={{ color: '#555' }}>Sin asignar</span>}
                </td>
                <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '13px' }}>
                  {o.fecha_entrada ? new Date(o.fecha_entrada).toLocaleDateString('es-CO') : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setDetalle(o)} style={btnVer}>👁️</button>
                    <button onClick={() => abrirEditar(o)} style={btnEditar}>✏️</button>
                    <button onClick={() => setConfirmEliminar(o)} style={btnEliminar}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nueva / editar orden */}
      {modal && (
        <div style={estiloOverlay}>
          <div style={estiloModal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>{editando ? '✏️ Editar orden' : '+ Nueva orden de trabajo'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Campo label="Vehículo *" full>
                <select value={form.vehiculo} onChange={e => setForm({ ...form, vehiculo: e.target.value })} style={estiloSelect}>
                  <option value="">Selecciona un vehículo</option>
                  {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo} ({v.cliente_nombre})</option>)}
                </select>
              </Campo>
              <Campo label="Estado">
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={estiloSelect}>
                  <option value="recibido">Recibido</option>
                  <option value="diagnostico">En diagnóstico</option>
                  <option value="aprobado">Aprobado por cliente</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="pausado">Pausado</option>
                  <option value="terminado">Terminado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </Campo>
              <Campo label="Prioridad">
                <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })} style={estiloSelect}>
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">⚡ Urgente</option>
                </select>
              </Campo>
              <Campo label="Técnico asignado">
                <select value={form.tecnico} onChange={e => setForm({ ...form, tecnico: e.target.value })} style={estiloSelect}>
                  <option value="">Sin asignar</option>
                  {tecnicos.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>
              </Campo>
              <Campo label="Kilometraje entrada">
                <input type="number" value={form.km_entrada} onChange={e => setForm({ ...form, km_entrada: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Fecha prometida de entrega">
                <input type="datetime-local" value={form.fecha_prometida} onChange={e => setForm({ ...form, fecha_prometida: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Descripción del problema (cliente) *" full>
                <textarea value={form.descripcion_cliente} onChange={e => setForm({ ...form, descripcion_cliente: e.target.value })}
                  style={{ ...estiloInputModal, height: '80px', resize: 'vertical' }}
                  placeholder="¿Qué dice el cliente que tiene el vehículo?" />
              </Campo>
              <Campo label="Diagnóstico técnico" full>
                <textarea value={form.diagnostico} onChange={e => setForm({ ...form, diagnostico: e.target.value })}
                  style={{ ...estiloInputModal, height: '80px', resize: 'vertical' }}
                  placeholder="Diagnóstico del técnico..." />
              </Campo>
              <Campo label="Observaciones internas" full>
                <textarea value={form.observaciones_internas} onChange={e => setForm({ ...form, observaciones_internas: e.target.value })}
                  style={{ ...estiloInputModal, height: '60px', resize: 'vertical' }} />
              </Campo>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={btnSecundario}>Cancelar</button>
              <button onClick={guardar} disabled={cargando} style={btnPrimario}>
                {cargando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear orden'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle orden */}
      {detalle && (
        <div style={estiloOverlay}>
          <div style={{ ...estiloModal, width: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#e63946' }}>{detalle.numero}</h2>
              <button onClick={() => setDetalle(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <Info label="Vehículo"      valor={detalle.vehiculo_placa} />
              <Info label="Cliente"       valor={detalle.cliente_nombre} />
              <Info label="Estado"        valor={detalle.estado?.replace('_', ' ')} color={coloresEstado[detalle.estado]} />
              <Info label="Prioridad"     valor={detalle.prioridad} color={coloresPrioridad[detalle.prioridad]} />
              <Info label="Técnico"       valor={detalle.tecnico_nombre || 'Sin asignar'} />
              <Info label="Km entrada"    valor={detalle.km_entrada?.toLocaleString() + ' km'} />
              <Info label="Fecha entrada" valor={detalle.fecha_entrada ? new Date(detalle.fecha_entrada).toLocaleString('es-CO') : '—'} />
              <Info label="Fecha prometida" valor={detalle.fecha_prometida ? new Date(detalle.fecha_prometida).toLocaleString('es-CO') : '—'} />
              <div style={{ gridColumn: 'span 2' }}>
                <Info label="Descripción del cliente" valor={detalle.descripcion_cliente} />
              </div>
              {detalle.diagnostico && (
                <div style={{ gridColumn: 'span 2' }}>
                  <Info label="Diagnóstico técnico" valor={detalle.diagnostico} />
                </div>
              )}
              {detalle.observaciones_internas && (
                <div style={{ gridColumn: 'span 2' }}>
                  <Info label="Observaciones internas" valor={detalle.observaciones_internas} />
                </div>
              )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => { setDetalle(null); abrirEditar(detalle); }} style={btnEditar}>✏️ Editar</button>
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
            <h3 style={{ margin: '0 0 8px' }}>¿Eliminar orden?</h3>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px' }}>
              <strong style={{ color: '#e63946' }}>{confirmEliminar.numero}</strong> — {confirmEliminar.vehiculo_placa}<br />
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
const btnEditar      = { background: '#1e3a5f', color: '#4fc3f7', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnEliminar    = { background: '#3a1e1e', color: '#e63946', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const estiloInput    = { padding: '10px 14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' };
const estiloInputModal = { width: '100%', padding: '8px 12px', background: '#0f0f23', border: '1px solid #2a2a3e', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' };
const estiloSelect   = { ...estiloInputModal, cursor: 'pointer' };
const estiloOverlay  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const estiloModal    = { background: '#1a1a2e', borderRadius: '16px', padding: '28px', width: '620px', maxHeight: '90vh', overflowY: 'auto', color: '#fff' };