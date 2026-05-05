import React, { useEffect, useState } from 'react';
import { getVehiculos, getClientes, crearVehiculo, editarVehiculo } from '../services/api';
import axios from 'axios';

const campoVacio = {
  cliente: '', tipo: 'moto', marca: '', modelo: '',
  anio: '', placa: '', color: '', cilindraje: '',
  numero_motor: '', numero_chasis: '', kilometraje: 0, notas: '',
};

export default function Vehiculos() {
  const [vehiculos, setVehiculos]   = useState([]);
  const [clientes, setClientes]     = useState([]);
  const [busqueda, setBusqueda]     = useState('');
  const [modal, setModal]           = useState(false);
  const [editando, setEditando]     = useState(null);
  const [form, setForm]             = useState(campoVacio);
  const [cargando, setCargando]     = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = () => {
    getVehiculos().then(r => setVehiculos(r.data.results || r.data));
    getClientes().then(r => setClientes(r.data.results || r.data));
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = vehiculos.filter(v => {
    const texto = `${v.placa} ${v.marca} ${v.modelo} ${v.cliente_nombre}`
      .toLowerCase().includes(busqueda.toLowerCase());
    const tipo = filtroTipo === 'todos' || v.tipo === filtroTipo;
    return texto && tipo;
  });

  const abrirNuevo = () => {
    setEditando(null);
    setForm(campoVacio);
    setModal(true);
  };

  const abrirEditar = (v) => {
    setEditando(v.id);
    setForm({
      cliente: v.cliente, tipo: v.tipo, marca: v.marca,
      modelo: v.modelo, anio: v.anio, placa: v.placa,
      color: v.color || '', cilindraje: v.cilindraje || '',
      numero_motor: v.numero_motor || '', numero_chasis: v.numero_chasis || '',
      kilometraje: v.kilometraje || 0, notas: v.notas || '',
    });
    setModal(true);
  };

  const guardar = async () => {
    if (!form.cliente || !form.placa || !form.marca || !form.modelo || !form.anio) {
      alert('Completa los campos obligatorios'); return;
    }
    setCargando(true);
    try {
      if (editando) {
        await editarVehiculo(editando, form);
      } else {
        await crearVehiculo(form);
      }
      setModal(false);
      setForm(campoVacio);
      setEditando(null);
      cargar();
    } catch (e) {
      alert('Error: ' + JSON.stringify(e.response?.data));
    }
    setCargando(false);
  };

  const eliminar = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/vehiculos/${id}/`);
      setConfirmEliminar(null);
      cargar();
    } catch (e) {
      alert('No se puede eliminar — puede tener órdenes asociadas');
    }
  };

  const iconoTipo = { moto: '🏍️', carro: '🚗', camion: '🚛', otro: '🚙' };

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🚗 Vehículos</h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '13px' }}>{vehiculos.length} vehículos registrados</p>
        </div>
        <button onClick={abrirNuevo} style={btnPrimario}>+ Nuevo vehículo</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          placeholder="🔍 Buscar por placa, marca, modelo o cliente..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ ...estiloInput, flex: 1 }}
        />
        {['todos', 'moto', 'carro', 'camion'].map(t => (
          <button key={t} onClick={() => setFiltroTipo(t)} style={{
            ...btnFiltro,
            background: filtroTipo === t ? '#e63946' : '#1a1a2e',
            color: filtroTipo === t ? '#fff' : '#888',
          }}>
            {t === 'todos' ? 'Todos' : iconoTipo[t] + ' ' + t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtrados.length === 0 ? (
          <p style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Sin vehículos registrados</p>
        ) : filtrados.map(v => (
          <div key={v.id} style={{
            background: '#1a1a2e', borderRadius: '12px', padding: '20px',
            border: '1px solid #2a2a3e', transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#e63946'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a3e'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '32px' }}>{iconoTipo[v.tipo] || '🚙'}</div>
              <span style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                background: v.tipo === 'moto' ? '#1e3a5f' : '#1e3a2f',
                color: v.tipo === 'moto' ? '#4fc3f7' : '#81c784',
              }}>
                {v.tipo?.toUpperCase()}
              </span>
            </div>

            <div style={{ fontSize: '20px', fontWeight: 700, color: '#e63946', marginBottom: '4px' }}>{v.placa}</div>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{v.marca} {v.modelo} {v.anio}</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
              <div>👤 {v.cliente_nombre}</div>
              {v.color     && <div>🎨 {v.color}</div>}
              {v.cilindraje && <div>⚙️ {v.cilindraje}</div>}
              <div>📍 {v.kilometraje?.toLocaleString()} km</div>
            </div>

            {/* Botones acción */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #2a2a3e', paddingTop: '12px' }}>
              <button onClick={() => abrirEditar(v)} style={btnEditar}>✏️ Editar</button>
              <button onClick={() => setConfirmEliminar(v)} style={btnEliminar}>🗑️ Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal nuevo / editar */}
      {modal && (
        <div style={estiloOverlay}>
          <div style={estiloModal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>{editando ? '✏️ Editar vehículo' : '+ Nuevo vehículo'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Campo label="Cliente *" full>
                <select value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} style={estiloSelect}>
                  <option value="">Selecciona un cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                </select>
              </Campo>
              <Campo label="Tipo *">
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={estiloSelect}>
                  <option value="moto">🏍️ Moto</option>
                  <option value="carro">🚗 Carro</option>
                  <option value="camion">🚛 Camión</option>
                  <option value="otro">🚙 Otro</option>
                </select>
              </Campo>
              <Campo label="Placa *">
                <input value={form.placa} onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })} style={estiloInputModal} placeholder="ABC123" />
              </Campo>
              <Campo label="Marca *">
                <input value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Modelo *">
                <input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Año *">
                <input type="number" value={form.anio} onChange={e => setForm({ ...form, anio: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Color">
                <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Cilindraje">
                <input value={form.cilindraje} onChange={e => setForm({ ...form, cilindraje: e.target.value })} style={estiloInputModal} placeholder="150cc" />
              </Campo>
              <Campo label="Kilometraje">
                <input type="number" value={form.kilometraje} onChange={e => setForm({ ...form, kilometraje: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="N° Motor">
                <input value={form.numero_motor} onChange={e => setForm({ ...form, numero_motor: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Notas" full>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} style={{ ...estiloInputModal, height: '70px', resize: 'vertical' }} />
              </Campo>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={btnSecundario}>Cancelar</button>
              <button onClick={guardar} disabled={cargando} style={btnPrimario}>
                {cargando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar vehículo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div style={estiloOverlay}>
          <div style={{ background: '#1a1a2e', borderRadius: '16px', padding: '28px', width: '400px', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px' }}>¿Eliminar vehículo?</h3>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px' }}>
              <strong style={{ color: '#e63946' }}>{confirmEliminar.placa}</strong> — {confirmEliminar.marca} {confirmEliminar.modelo}<br />
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

const btnPrimario    = { background: '#e63946', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' };
const btnSecundario  = { background: '#2a2a3e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' };
const btnFiltro      = { border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 };
const btnEditar      = { flex: 1, background: '#1e3a5f', color: '#4fc3f7', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 };
const btnEliminar    = { flex: 1, background: '#3a1e1e', color: '#e63946', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 };
const estiloInput    = { padding: '10px 14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' };
const estiloInputModal = { width: '100%', padding: '8px 12px', background: '#0f0f23', border: '1px solid #2a2a3e', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' };
const estiloSelect   = { ...estiloInputModal, cursor: 'pointer' };
const estiloOverlay  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const estiloModal    = { background: '#1a1a2e', borderRadius: '16px', padding: '28px', width: '600px', maxHeight: '90vh', overflowY: 'auto', color: '#fff' };