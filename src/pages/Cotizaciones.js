import React, { useEffect, useState } from 'react';
import { getCotizaciones, crearCotizacion, getClientes, getVehiculos, getServicios, getProductos } from '../services/api';
import axios from 'axios';

const campoVacio = {
  cliente: '', vehiculo: '', estado: 'borrador',
  validez_dias: 15, subtotal: 0, descuento_total: 0,
  impuesto: 0, total: 0, notas: '', items: [],
};

const itemVacio = { descripcion: '', cantidad: 1, precio_unitario: 0, descuento: 0 };

const coloresEstado = {
  borrador:  '#888',
  enviada:   '#4fc3f7',
  aprobada:  '#2a9d8f',
  rechazada: '#e63946',
  vencida:   '#f4a261',
};

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes]         = useState([]);
  const [vehiculos, setVehiculos]       = useState([]);
  const [servicios, setServicios]       = useState([]);
  const [productos, setProductos]       = useState([]);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [modal, setModal]               = useState(false);
  const [detalle, setDetalle]           = useState(null);
  const [form, setForm]                 = useState(campoVacio);
  const [cargando, setCargando]         = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const formatPeso = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0);

  const cargar = () => {
    getCotizaciones().then(r => setCotizaciones(r.data.results || r.data)).catch(() => {});
    getClientes().then(r => setClientes(r.data.results || r.data)).catch(() => {});
    getVehiculos().then(r => setVehiculos(r.data.results || r.data)).catch(() => {});
    getServicios().then(r => setServicios(r.data.results || r.data)).catch(() => {});
    getProductos().then(r => setProductos(r.data.results || r.data)).catch(() => {});
  };

  useEffect(() => { cargar(); }, []);

  const vehiculosCliente = vehiculos.filter(v =>
    form.cliente ? String(v.cliente) === String(form.cliente) : true
  );

  const calcularTotal = (f) => {
    const sub  = parseFloat(f.subtotal) || 0;
    const desc = parseFloat(f.descuento_total) || 0;
    const imp  = parseFloat(f.impuesto) || 0;
    return sub - desc + imp;
  };

  const recalcularDesdeItems = (items) => {
    const sub = items.reduce((acc, i) => {
      const bruto = (parseFloat(i.precio_unitario) || 0) * (parseFloat(i.cantidad) || 0);
      const desc  = (parseFloat(i.descuento) || 0);
      return acc + bruto - desc;
    }, 0);
    return sub;
  };

  const actualizarItem = (idx, campo, valor) => {
    const nuevos = form.items.map((it, i) => i === idx ? { ...it, [campo]: valor } : it);
    const sub = recalcularDesdeItems(nuevos);
    setForm({ ...form, items: nuevos, subtotal: sub });
  };

  const agregarItem = () => setForm({ ...form, items: [...form.items, { ...itemVacio }] });

  const eliminarItem = (idx) => {
    const nuevos = form.items.filter((_, i) => i !== idx);
    const sub = recalcularDesdeItems(nuevos);
    setForm({ ...form, items: nuevos, subtotal: sub });
  };

  const agregarServicio = (srv) => {
    const nuevo = { descripcion: srv.nombre, cantidad: 1, precio_unitario: srv.precio || 0, descuento: 0 };
    const nuevos = [...form.items, nuevo];
    const sub = recalcularDesdeItems(nuevos);
    setForm({ ...form, items: nuevos, subtotal: sub });
  };

  const guardar = async () => {
    if (!form.cliente) { alert('Selecciona un cliente'); return; }
    if (form.items.length === 0) { alert('Agrega al menos un ítem'); return; }
    setCargando(true);
    try {
      const datos = {
        ...form,
        total: calcularTotal(form),
        vehiculo: form.vehiculo || null,
        items: form.items.map(i => ({
          ...i,
          cantidad: parseFloat(i.cantidad) || 1,
          precio_unitario: parseFloat(i.precio_unitario) || 0,
          descuento: parseFloat(i.descuento) || 0,
        })),
      };
      await crearCotizacion(datos);
      setModal(false);
      setForm(campoVacio);
      cargar();
    } catch (e) {
      alert('Error: ' + JSON.stringify(e.response?.data));
    }
    setCargando(false);
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/cotizaciones/${id}/`, { estado });
      cargar();
      if (detalle?.id === id) setDetalle({ ...detalle, estado });
    } catch (e) { alert('Error al cambiar estado'); }
  };

  const eliminar = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/cotizaciones/${id}/`);
      setConfirmEliminar(null);
      cargar();
    } catch { alert('No se puede eliminar esta cotización'); }
  };

  const convertirFactura = async (cot) => {
    if (!window.confirm(`¿Convertir cotización ${cot.numero} en factura?`)) return;
    try {
      await axios.post(`http://127.0.0.1:8000/api/cotizaciones/${cot.id}/convertir_factura/`);
      alert('Factura creada exitosamente');
      cargar();
    } catch { alert('Error al convertir en factura'); }
  };

  const filtrados = cotizaciones.filter(c => {
    const texto = `${c.numero || ''} ${c.cliente_nombre || ''}`.toLowerCase().includes(busqueda.toLowerCase());
    const estado = filtroEstado === 'todos' || c.estado === filtroEstado;
    return texto && estado;
  });

  const estados = ['todos', 'borrador', 'enviada', 'aprobada', 'rechazada', 'vencida'];

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>📄 Cotizaciones</h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: '13px' }}>{cotizaciones.length} cotizaciones en total</p>
        </div>
        <button onClick={() => { setForm(campoVacio); setModal(true); }} style={btnPrimario}>
          + Nueva cotización
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Borrador',  estado: 'borrador',  color: '#888' },
          { label: 'Enviadas',  estado: 'enviada',   color: '#4fc3f7' },
          { label: 'Aprobadas', estado: 'aprobada',  color: '#2a9d8f' },
          { label: 'Rechazadas',estado: 'rechazada', color: '#e63946' },
          { label: 'Vencidas',  estado: 'vencida',   color: '#f4a261' },
        ].map(item => (
          <div key={item.estado} style={{
            background: '#1a1a2e', borderRadius: '10px', padding: '16px',
            borderLeft: `3px solid ${item.color}`,
          }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: item.color }}>
              {cotizaciones.filter(c => c.estado === item.estado).length}
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
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
              {['Número', 'Cliente', 'Vehículo', 'Estado', 'Total', 'Validez', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '12px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Sin cotizaciones</td></tr>
            ) : filtrados.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid #2a2a3e' }}
                onMouseEnter={e => e.currentTarget.style.background = '#151528'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#e63946' }}>{c.numero || `COT-${c.id}`}</td>
                <td style={{ padding: '12px 16px' }}>{c.cliente_nombre || '—'}</td>
                <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '13px' }}>{c.vehiculo_placa || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                    background: (coloresEstado[c.estado] || '#888') + '33',
                    color: coloresEstado[c.estado] || '#888', fontWeight: 600,
                  }}>{c.estado}</span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{formatPeso(c.total)}</td>
                <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '13px' }}>
                  {c.validez_dias ? `${c.validez_dias} días` : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setDetalle(c)} style={btnVer}>👁️</button>
                    {c.estado === 'borrador' && (
                      <button onClick={() => cambiarEstado(c.id, 'enviada')} style={btnEnviar}>📤</button>
                    )}
                    {c.estado === 'enviada' && (
                      <button onClick={() => cambiarEstado(c.id, 'aprobada')} style={btnAprobar}>✅</button>
                    )}
                    {c.estado === 'aprobada' && (
                      <button onClick={() => convertirFactura(c)} style={btnFactura}>🧾</button>
                    )}
                    <button onClick={() => setConfirmEliminar(c)} style={btnEliminar}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nueva cotización */}
      {modal && (
        <div style={estiloOverlay}>
          <div style={{ ...estiloModal, width: '720px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>📄 Nueva cotización</h2>
              <button onClick={() => setModal(false)} style={btnCerrar}>✕</button>
            </div>

            {/* Datos generales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <Campo label="Cliente *" full>
                <select
                  value={form.cliente}
                  onChange={e => setForm({ ...form, cliente: e.target.value, vehiculo: '' })}
                  style={estiloSelect}
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                </select>
              </Campo>
              <Campo label="Vehículo (opcional)" full>
                <select value={form.vehiculo} onChange={e => setForm({ ...form, vehiculo: e.target.value })} style={estiloSelect}>
                  <option value="">Sin vehículo asociado</option>
                  {vehiculosCliente.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo}</option>)}
                </select>
              </Campo>
              <Campo label="Validez (días)">
                <input type="number" value={form.validez_dias} onChange={e => setForm({ ...form, validez_dias: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Notas">
                <input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} style={estiloInputModal} placeholder="Observaciones..." />
              </Campo>
            </div>

            {/* Agregar rápido desde servicios */}
            {servicios.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>AGREGAR SERVICIO RÁPIDO</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {servicios.slice(0, 8).map(s => (
                    <button key={s.id} onClick={() => agregarServicio(s)} style={{
                      background: '#1e1e3a', border: '1px solid #2a2a3e', color: '#aaa',
                      padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                    }}>
                      + {s.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ítems */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>ÍTEMS DE LA COTIZACIÓN</div>
                <button onClick={agregarItem} style={{ ...btnSecundario, padding: '4px 12px', fontSize: '12px' }}>+ Agregar ítem</button>
              </div>

              {form.items.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '13px', background: '#0f0f23', borderRadius: '8px' }}>
                  Sin ítems. Agrega servicios o ítems manualmente.
                </div>
              ) : (
                <div style={{ background: '#0f0f23', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ color: '#666' }}>
                        {['Descripción', 'Cant.', 'Precio unit.', 'Descuento', 'Subtotal', ''].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 500, fontSize: '11px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, idx) => {
                        const bruto = (parseFloat(item.precio_unitario) || 0) * (parseFloat(item.cantidad) || 0);
                        const neto  = bruto - (parseFloat(item.descuento) || 0);
                        return (
                          <tr key={idx} style={{ borderTop: '1px solid #1a1a2e' }}>
                            <td style={{ padding: '6px 10px' }}>
                              <input value={item.descripcion} onChange={e => actualizarItem(idx, 'descripcion', e.target.value)}
                                style={{ ...estiloInputModal, width: '100%' }} placeholder="Descripción..." />
                            </td>
                            <td style={{ padding: '6px 10px', width: '60px' }}>
                              <input type="number" value={item.cantidad} onChange={e => actualizarItem(idx, 'cantidad', e.target.value)}
                                style={{ ...estiloInputModal, width: '100%' }} min="1" />
                            </td>
                            <td style={{ padding: '6px 10px', width: '120px' }}>
                              <input type="number" value={item.precio_unitario} onChange={e => actualizarItem(idx, 'precio_unitario', e.target.value)}
                                style={{ ...estiloInputModal, width: '100%' }} />
                            </td>
                            <td style={{ padding: '6px 10px', width: '100px' }}>
                              <input type="number" value={item.descuento} onChange={e => actualizarItem(idx, 'descuento', e.target.value)}
                                style={{ ...estiloInputModal, width: '100%' }} />
                            </td>
                            <td style={{ padding: '6px 10px', color: '#2a9d8f', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {formatPeso(neto)}
                            </td>
                            <td style={{ padding: '6px 10px' }}>
                              <button onClick={() => eliminarItem(idx)} style={{ ...btnEliminar, padding: '4px 8px' }}>✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Totales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <Campo label="Descuento adicional">
                <input type="number" value={form.descuento_total} onChange={e => setForm({ ...form, descuento_total: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Impuesto (IVA)">
                <input type="number" value={form.impuesto} onChange={e => setForm({ ...form, impuesto: e.target.value })} style={estiloInputModal} />
              </Campo>
              <Campo label="Total">
                <div style={{ padding: '8px 12px', background: '#0a0a1a', borderRadius: '6px', fontSize: '16px', fontWeight: 700, color: '#e63946' }}>
                  {formatPeso(calcularTotal(form))}
                </div>
              </Campo>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={btnSecundario}>Cancelar</button>
              <button onClick={guardar} disabled={cargando} style={btnPrimario}>
                {cargando ? 'Guardando...' : 'Crear cotización'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div style={estiloOverlay}>
          <div style={{ ...estiloModal, width: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#e63946' }}>{detalle.numero || `COT-${detalle.id}`}</h2>
              <button onClick={() => setDetalle(null)} style={btnCerrar}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px', marginBottom: '16px' }}>
              <Info label="Cliente"    valor={detalle.cliente_nombre} />
              <Info label="Vehículo"   valor={detalle.vehiculo_placa || '—'} />
              <Info label="Estado"     valor={detalle.estado} color={coloresEstado[detalle.estado]} />
              <Info label="Validez"    valor={detalle.validez_dias ? `${detalle.validez_dias} días` : '—'} />
              <Info label="Subtotal"   valor={formatPeso(detalle.subtotal)} />
              <Info label="Descuento"  valor={formatPeso(detalle.descuento_total)} />
              <Info label="Impuesto"   valor={formatPeso(detalle.impuesto)} />
              <Info label="Total"      valor={formatPeso(detalle.total)} color="#e63946" />
            </div>

            {detalle.items?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>ÍTEMS</div>
                <div style={{ background: '#0f0f23', borderRadius: '8px', overflow: 'hidden' }}>
                  {detalle.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderTop: i > 0 ? '1px solid #1a1a2e' : 'none', fontSize: '13px' }}>
                      <span style={{ color: '#ccc' }}>{it.descripcion} × {it.cantidad}</span>
                      <span style={{ color: '#2a9d8f', fontWeight: 600 }}>{formatPeso((it.precio_unitario * it.cantidad) - (it.descuento || 0))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detalle.notas && (
              <div style={{ background: '#0f0f23', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#aaa', marginBottom: '16px' }}>
                {detalle.notas}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {detalle.estado === 'borrador' && (
                <button onClick={() => { cambiarEstado(detalle.id, 'enviada'); setDetalle(null); }} style={btnEnviar}>📤 Enviar</button>
              )}
              {detalle.estado === 'enviada' && (
                <button onClick={() => { cambiarEstado(detalle.id, 'aprobada'); setDetalle(null); }} style={btnAprobar}>✅ Aprobar</button>
              )}
              {detalle.estado === 'aprobada' && (
                <button onClick={() => { convertirFactura(detalle); setDetalle(null); }} style={btnFactura}>🧾 Convertir a factura</button>
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
            <h3 style={{ margin: '0 0 8px' }}>¿Eliminar cotización?</h3>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px' }}>
              <strong style={{ color: '#e63946' }}>{confirmEliminar.numero || `COT-${confirmEliminar.id}`}</strong><br />
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

const btnPrimario   = { background: '#e63946', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' };
const btnSecundario = { background: '#2a2a3e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' };
const btnVer        = { background: '#1e3a2f', color: '#81c784', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnEnviar     = { background: '#1e3a5f', color: '#4fc3f7', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnAprobar    = { background: '#1e3a30', color: '#2a9d8f', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnFactura    = { background: '#3a2e1e', color: '#f4a261', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnEliminar   = { background: '#3a1e1e', color: '#e63946', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnCerrar     = { background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' };
const estiloInput   = { padding: '10px 14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' };
const estiloInputModal = { width: '100%', padding: '8px 12px', background: '#0f0f23', border: '1px solid #2a2a3e', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' };
const estiloSelect  = { ...estiloInputModal, cursor: 'pointer' };
const estiloOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const estiloModal   = { background: '#1a1a2e', borderRadius: '16px', padding: '28px', maxHeight: '90vh', overflowY: 'auto', color: '#fff' };
