import React, { useEffect, useState } from 'react';
import { getClientes, crearCliente, editarCliente, eliminarCliente } from '../services/api';

const campoVacio = {
  tipo_documento: 'cc', numero_documento: '', nombre: '',
  apellido: '', telefono: '', telefono_alt: '', email: '',
  direccion: '', ciudad: '', notas: '',
};

export default function Clientes() {
  const [clientes, setClientes]   = useState([]);
  const [busqueda, setBusqueda]   = useState('');
  const [modal, setModal]         = useState(false);
  const [editando, setEditando]   = useState(null);
  const [form, setForm]           = useState(campoVacio);
  const [cargando, setCargando]   = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = () => getClientes().then(r => setClientes(r.data.results || r.data));

  useEffect(() => { cargar(); }, []);

  const filtrados = clientes.filter(c =>
    `${c.nombre} ${c.apellido} ${c.numero_documento} ${c.telefono}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirNuevo = () => {
    setEditando(null);
    setForm(campoVacio);
    setModal(true);
  };

  const abrirEditar = (c) => {
    setEditando(c.id);
    setForm({
      tipo_documento:   c.tipo_documento,
      numero_documento: c.numero_documento,
      nombre:           c.nombre,
      apellido:         c.apellido,
      telefono:         c.telefono,
      telefono_alt:     c.telefono_alt || '',
      email:            c.email || '',
      direccion:        c.direccion || '',
      ciudad:           c.ciudad || '',
      notas:            c.notas || '',
    });
    setModal(true);
  };

  const guardar = async () => {
    if (!form.numero_documento || !form.nombre || !form.apellido || !form.telefono) {
      alert('Completa los campos obligatorios'); return;
    }
    setCargando(true);
    try {
      if (editando) {
        await editarCliente(editando, form);
      } else {
        await crearCliente(form);
      }
      setModal(false);
      setForm(campoVacio);
      setEditando(null);
      cargar();
    } catch (e) {
      alert('Error al guardar: ' + JSON.stringify(e.response?.data));
    }
    setCargando(false);
  };

  const eliminar = async (id) => {
    try {
      await eliminarCliente(id);
      setConfirmEliminar(null);
      cargar();
    } catch (e) {
      alert('No se puede eliminar — puede tener vehículos o facturas asociadas');
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>👤 Clientes</h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '13px' }}>{clientes.length} clientes registrados</p>
        </div>
        <button onClick={abrirNuevo} style={btnPrimario}>+ Nuevo cliente</button>
      </div>

      {/* Buscador */}
      <input
        placeholder="🔍 Buscar por nombre, documento o teléfono..."
        value={busqueda} onChange={e => setBusqueda(e.target.value)}
        style={estiloInput}
      />

      {/* Tabla */}
      <div style={{ background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden', marginTop: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#0d0d1a', color: '#888' }}>
              {['Nombre', 'Documento', 'Teléfono', 'Ciudad', 'Email', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Sin clientes registrados</td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid #2a2a3e' }}
                onMouseEnter={e => e.currentTarget.style.background = '#151528'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                  {c.nombre} {c.apellido}
                  {!c.activo && <span style={{ fontSize: '11px', color: '#e63946', marginLeft: '8px' }}>Inactivo</span>}
                </td>
                <td style={{ padding: '12px 16px', color: '#aaa' }}>{c.tipo_documento?.toUpperCase()} {c.numero_documento}</td>
                <td style={{ padding: '12px 16px', color: '#aaa' }}>{c.telefono}</td>
                <td style={{ padding: '12px 16px', color: '#aaa' }}>{c.ciudad || '—'}</td>
                <td style={{ padding: '12px 16px', color: '#aaa' }}>{c.email || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => abrirEditar(c)} style={btnEditar}>✏️ Editar</button>
                    <button onClick={() => setConfirmEliminar(c)} style={btnEliminar}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo / editar cliente */}
      {modal && (
        <div style={estiloOverlay}>
          <div style={estiloModal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>{editando ? '✏️ Editar cliente' : '+ Nuevo cliente'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Campo label="Tipo documento">
                <select value={form.tipo_documento} onChange={e => setForm({ ...form, tipo_documento: e.target.value })} style={estiloSelect}>
                  <option value="cc">Cédula</option>
                  <option value="nit">NIT</option>
                  <option value="ce">Cédula extranjería</option>
                  <option value="pas">Pasaporte</option>
                </select>
              </Campo>
              <Campo label="Número documento *">
                <input value={form.numero_documento} onChange={e => setForm({ ...form, numero_documento: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Nombre *">
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Apellido *">
                <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Teléfono *">
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Teléfono alternativo">
                <input value={form.telefono_alt} onChange={e => setForm({ ...form, telefono_alt: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Email">
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Ciudad">
                <input value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Dirección" full>
                <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Notas internas" full>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} style={{ ...estiloInputModal, height: '70px', resize: 'vertical' }} />
              </Campo>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={btnSecundario}>Cancelar</button>
              <button onClick={guardar} disabled={cargando} style={btnPrimario}>
                {cargando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar cliente'}
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
            <h3 style={{ margin: '0 0 8px' }}>¿Eliminar cliente?</h3>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px' }}>
              <strong style={{ color: '#e63946' }}>{confirmEliminar.nombre} {confirmEliminar.apellido}</strong><br />
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
const btnEditar      = { background: '#1e3a5f', color: '#4fc3f7', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 };
const btnEliminar    = { background: '#3a1e1e', color: '#e63946', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const estiloInput    = { width: '100%', padding: '10px 14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' };
const estiloInputModal = { width: '100%', padding: '8px 12px', background: '#0f0f23', border: '1px solid #2a2a3e', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' };
const estiloSelect   = { ...estiloInputModal, cursor: 'pointer' };
const estiloOverlay  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const estiloModal    = { background: '#1a1a2e', borderRadius: '16px', padding: '28px', width: '600px', maxHeight: '90vh', overflowY: 'auto', color: '#fff' };