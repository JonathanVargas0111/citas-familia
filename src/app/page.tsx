'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, Persona, Cita } from '@/lib/supabase';
import { 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  Plus, 
  UserCheck, 
  Share2, 
  HeartHandshake, 
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const MOCK_PERSONAS: Persona[] = [
  { id: '1', nombre: 'Abuelita Elena', parentesco: 'Abuela', eps: 'Sanitas', telefono: '3001234567', notas: 'Camina despacio, llevar bastón.' },
  { id: '2', nombre: 'Tía Martha', parentesco: 'Tía', eps: 'Compensar', telefono: '3109876543', notas: 'Ayuno obligatorio para exámenes.' },
];

const MOCK_CITAS: Cita[] = [
  {
    id: 'c1',
    persona_id: '1',
    especialidad: 'Cardiología',
    doctor: 'Dr. Fernando Ruiz',
    fecha_hora: '2026-10-16T08:30:00',
    lugar: 'Clínica Reina Sofía',
    direccion: 'Carrera 21 # 127-03, Bogotá',
    acompanante: '',
    estado: 'pendiente',
    notas: 'Llevar electrocardiograma previo y carné de vacunación.',
  },
  {
    id: 'c2',
    persona_id: '2',
    especialidad: 'Laboratorio de Sangre',
    doctor: 'Dra. Silva',
    fecha_hora: '2026-10-18T07:00:00',
    lugar: 'Sede Calle 134',
    direccion: 'Calle 134 # 9-20, Bogotá',
    acompanante: 'Camilo (Nieto)',
    acompanante_telefono: '3150001122',
    estado: 'acompanada',
    notas: 'Cita en ayunas desde las 8pm del día anterior.',
  }
];

export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [filtroPersona, setFiltroPersona] = useState<string>('todos');
  const [modalPersonaAbierto, setModalPersonaAbierto] = useState(false);
  const [modalCitaAbierto, setModalCitaAbierto] = useState(false);
  const [keepaliveStatus, setKeepaliveStatus] = useState<string | null>(null);

  // Formulario Persona
  const [nuevaPersona, setNuevaPersona] = useState({
    nombre: '',
    parentesco: '',
    eps: '',
    telefono: '',
    notas: ''
  });

  // Formulario Cita
  const [nuevaCita, setNuevaCita] = useState({
    persona_id: '',
    especialidad: '',
    doctor: '',
    fecha_hora: '',
    lugar: '',
    direccion: '',
    notas: ''
  });

  // Cargar datos
  const cargarDatos = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data: dataPersonas } = await supabase.from('personas').select('*').order('nombre');
      const { data: dataCitas } = await supabase.from('citas').select('*').order('fecha_hora');
      
      if (dataPersonas && dataPersonas.length > 0) setPersonas(dataPersonas);
      else setPersonas(MOCK_PERSONAS);

      if (dataCitas && dataCitas.length > 0) setCitas(dataCitas);
      else setCitas(MOCK_CITAS);
    } else {
      // Usar localStorage o mock
      const guardadoPersonas = localStorage.getItem('familia_personas');
      const guardadoCitas = localStorage.getItem('familia_citas');
      setPersonas(guardadoPersonas ? JSON.parse(guardadoPersonas) : MOCK_PERSONAS);
      setCitas(guardadoCitas ? JSON.parse(guardadoCitas) : MOCK_CITAS);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Guardar persona
  const handleGuardarPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaPersona.nombre || !nuevaPersona.parentesco) return;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('personas').insert([nuevaPersona]);
      if (!error) cargarDatos();
    } else {
      const item: Persona = { id: Date.now().toString(), ...nuevaPersona };
      const actualizadas = [...personas, item];
      setPersonas(actualizadas);
      localStorage.setItem('familia_personas', JSON.stringify(actualizadas));
    }

    setNuevaPersona({ nombre: '', parentesco: '', eps: '', telefono: '', notas: '' });
    setModalPersonaAbierto(false);
  };

  // Guardar cita
  const handleGuardarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCita.persona_id || !nuevaCita.especialidad || !nuevaCita.fecha_hora) return;

    const payload = {
      ...nuevaCita,
      estado: 'pendiente' as const,
      acompanante: ''
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('citas').insert([payload]);
      if (!error) cargarDatos();
    } else {
      const item: Cita = { id: Date.now().toString(), ...payload };
      const actualizadas = [...citas, item];
      setCitas(actualizadas);
      localStorage.setItem('familia_citas', JSON.stringify(actualizadas));
    }

    setNuevaCita({
      persona_id: '',
      especialidad: '',
      doctor: '',
      fecha_hora: '',
      lugar: '',
      direccion: '',
      notas: ''
    });
    setModalCitaAbierto(false);
  };

  // Acompañar cita
  const postularseAcompanante = async (citaId: string) => {
    const nombre = prompt('¿Cuál es tu nombre (nieto/a, hijo/a)?');
    if (!nombre) return;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('citas').update({
        acompanante: nombre,
        estado: 'acompanada'
      }).eq('id', citaId);
      cargarDatos();
    } else {
      const actualizadas = citas.map(c => 
        c.id === citaId ? { ...c, acompanante: nombre, estado: 'acompanada' as const } : c
      );
      setCitas(actualizadas);
      localStorage.setItem('familia_citas', JSON.stringify(actualizadas));
    }
  };

  // Compartir a WhatsApp
  const compartirWhatsApp = (cita: Cita) => {
    const paciente = personas.find(p => p.id === cita.persona_id)?.nombre || 'Familiar';
    const fecha = new Date(cita.fecha_hora).toLocaleString('es-CO', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const texto = `🏥 *Cita Médica Familia*\n\n` +
      `👤 *Paciente:* ${paciente}\n` +
      `🩺 *Especialidad:* ${cita.especialidad}\n` +
      `🗓️ *Fecha:* ${fecha}\n` +
      `📍 *Lugar:* ${cita.lugar} (${cita.direccion || 'Sin dirección específica'})\n` +
      `🤝 *Acompañante:* ${cita.acompanante ? `✅ ${cita.acompanante}` : '⚠️ ¡FALTA ACOMPAÑANTE!'}\n` +
      (cita.notas ? `📝 *Notas:* ${cita.notas}\n` : '') +
      `\nOrganizado con la app familiar.`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // Probar Keepalive diario
  const probarKeepalive = async () => {
    setKeepaliveStatus('Probando ping...');
    try {
      const res = await fetch('/api/keepalive');
      const data = await res.json();
      setKeepaliveStatus(`✅ Keepalive activo: ${data.status} (${new Date().toLocaleTimeString()})`);
    } catch {
      setKeepaliveStatus('❌ Error al probar keepalive');
    }
  };

  const citasFiltradas = citas.filter(c => 
    filtroPersona === 'todos' ? true : c.persona_id === filtroPersona
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <header className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <HeartHandshake className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Citas Médicas Familia</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Coordinación de citas, horarios y acompañantes para los abuelos y tías.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setModalPersonaAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium text-sm transition"
            >
              <User className="w-4 h-4 text-slate-600" />
              + Agregar Persona
            </button>
            <button 
              onClick={() => setModalCitaAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              + Programar Cita
            </button>
          </div>
        </header>

        {/* Estado Supabase y Anti-Pausa Keepalive */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">Estado del Sistema:</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {isSupabaseConfigured ? '🟢 Conectado a Supabase' : '🟡 Modo Local (Sin credenciales aún)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {keepaliveStatus && (
              <span className="text-slate-600 font-medium">{keepaliveStatus}</span>
            )}
            <button 
              onClick={probarKeepalive}
              className="text-blue-600 hover:underline font-semibold"
            >
              Probar Keepalive diario anti-pausa
            </button>
          </div>
        </div>

        {/* Filtros rápidos por persona */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Filtrar:</span>
          <button 
            onClick={() => setFiltroPersona('todos')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filtroPersona === 'todos' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos ({citas.length})
          </button>
          {personas.map(p => (
            <button 
              key={p.id}
              onClick={() => setFiltroPersona(p.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filtroPersona === p.id 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p.nombre} ({citas.filter(c => c.persona_id === p.id).length})
            </button>
          ))}
        </div>

        {/* Listado de Citas */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Próximas Citas Médicas
          </h2>

          {citasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No hay citas registradas para este filtro.</p>
              <p className="text-slate-400 text-sm mt-1">Hacé clic en "+ Programar Cita" para agendar una.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {citasFiltradas.map(cita => {
                const paciente = personas.find(p => p.id === cita.persona_id);
                const fechaObj = new Date(cita.fecha_hora);
                const fechaFormateada = fechaObj.toLocaleDateString('es-CO', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short' 
                });
                const horaFormateada = fechaObj.toLocaleTimeString('es-CO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                const tieneAcompanante = Boolean(cita.acompanante);

                return (
                  <div 
                    key={cita.id} 
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div className="space-y-3">
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                            {cita.especialidad}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 mt-1">
                            {paciente?.nombre || 'Paciente'}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {paciente?.parentesco} • EPS: {paciente?.eps || 'No registrada'}
                          </p>
                        </div>

                        {tieneAcompanante ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Acompaña: {cita.acompanante}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Sin acompañante
                          </span>
                        )}
                      </div>

                      {/* Detalles */}
                      <div className="space-y-1.5 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-900 capitalize">{fechaFormateada}</span> a las <span className="font-semibold text-slate-900">{horaFormateada}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{cita.lugar}</span>
                          {cita.direccion && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cita.lugar + ' ' + cita.direccion)}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center text-xs ml-1"
                            >
                              Maps <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          )}
                        </div>
                        {cita.doctor && (
                          <div className="text-xs text-slate-500 pl-6">
                            Doctor: {cita.doctor}
                          </div>
                        )}
                        {cita.notas && (
                          <div className="text-xs text-slate-500 pl-6 italic">
                            Nota: {cita.notas}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                      {!tieneAcompanante ? (
                        <button
                          onClick={() => postularseAcompanante(cita.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          <UserCheck className="w-4 h-4" />
                          Yo acompaño
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Asignado
                        </span>
                      )}

                      <button
                        onClick={() => compartirWhatsApp(cita)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-200"
                        title="Enviar resumen a grupo de WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Nueva Persona */}
        {modalPersonaAbierto && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Agregar Persona / Familiar</h3>
              <form onSubmit={handleGuardarPersona} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="ej: Abuelita María" 
                    required 
                    value={nuevaPersona.nombre}
                    onChange={e => setNuevaPersona({ ...nuevaPersona, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Parentesco</label>
                  <input 
                    type="text" 
                    placeholder="ej: Abuela, Tía, Mamá" 
                    required 
                    value={nuevaPersona.parentesco}
                    onChange={e => setNuevaPersona({ ...nuevaPersona, parentesco: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">EPS o Seguro</label>
                  <input 
                    type="text" 
                    placeholder="ej: Sanitas, Sura" 
                    value={nuevaPersona.eps}
                    onChange={e => setNuevaPersona({ ...nuevaPersona, eps: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notas especiales</label>
                  <input 
                    type="text" 
                    placeholder="ej: Camina despacio, medicación matutina" 
                    value={nuevaPersona.notas}
                    onChange={e => setNuevaPersona({ ...nuevaPersona, notas: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-3 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setModalPersonaAbierto(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Nueva Cita */}
        {modalCitaAbierto && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Programar Cita Médica</h3>
              <form onSubmit={handleGuardarCita} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Paciente</label>
                  <select 
                    required 
                    value={nuevaCita.persona_id}
                    onChange={e => setNuevaCita({ ...nuevaCita, persona_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar paciente...</option>
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.parentesco})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Especialidad / Tipo de cita</label>
                  <input 
                    type="text" 
                    placeholder="ej: Cardiología, Oftalmología, Laboratorio" 
                    required 
                    value={nuevaCita.especialidad}
                    onChange={e => setNuevaCita({ ...nuevaCita, especialidad: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha y Hora</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={nuevaCita.fecha_hora}
                    onChange={e => setNuevaCita({ ...nuevaCita, fecha_hora: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lugar / Clínica</label>
                  <input 
                    type="text" 
                    placeholder="ej: Clínica Reina Sofía, Sede Calle 100" 
                    required 
                    value={nuevaCita.lugar}
                    onChange={e => setNuevaCita({ ...nuevaCita, lugar: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección (para Maps / Waze)</label>
                  <input 
                    type="text" 
                    placeholder="ej: Carrera 21 # 127-03" 
                    value={nuevaCita.direccion}
                    onChange={e => setNuevaCita({ ...nuevaCita, direccion: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="ej: Dr. Ruiz" 
                    value={nuevaCita.doctor}
                    onChange={e => setNuevaCita({ ...nuevaCita, doctor: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Recomendaciones / Notas</label>
                  <input 
                    type="text" 
                    placeholder="ej: En ayunas, llevar exámenes anteriores" 
                    value={nuevaCita.notas}
                    onChange={e => setNuevaCita({ ...nuevaCita, notas: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-3 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setModalCitaAbierto(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                  >
                    Guardar Cita
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
