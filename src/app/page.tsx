'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  User, 
  MapPin, 
  Clock, 
  Plus, 
  UserCheck, 
  Share2, 
  HeartHandshake, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Users, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  MessageCircle, 
  X, 
  ArrowLeft, 
  Maximize2, 
  CalendarDays,
  Copy,
  Link as LinkIcon
} from 'lucide-react';

interface Persona {
  id: string;
  nombre: string;
  parentesco: string;
  eps?: string;
  telefono?: string;
  notas?: string;
}

interface Nieto {
  id: string;
  nombre: string;
  telefono?: string;
}

interface Cita {
  id: string;
  persona_id: string;
  especialidad: string;
  doctor?: string;
  fecha_hora: string;
  lugar: string;
  direccion?: string;
  acompanante?: string;
  acompanante_telefono?: string;
  estado: 'pendiente' | 'acompanada' | 'completada';
  notas?: string;
}

export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [nietos, setNietos] = useState<Nieto[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  // Perfil individual seleccionado
  const [personaEnPerfil, setPersonaEnPerfil] = useState<Persona | null>(null);
  const [mensajeCopiado, setMensajeCopiado] = useState(false);

  // Modo de calendario: 'semana' por defecto
  const [modoCalendario, setModoCalendario] = useState<'semana' | 'mes'>('semana');

  // Fecha base del calendario (Inicia en Octubre 12, 2026)
  const [fechaReferencia, setFechaReferencia] = useState(new Date(2026, 9, 12));
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [hoyIso, setHoyIso] = useState<string>('');

  useEffect(() => {
    setHoyIso(new Date().toISOString().split('T')[0]);
  }, []);

  // Modales
  const [modalPersonaAbierto, setModalPersonaAbierto] = useState(false);
  const [modalNietoAbierto, setModalNietoAbierto] = useState(false);
  const [modalCitaAbierto, setModalCitaAbierto] = useState(false);
  const [citaSeleccionadaParaAcompanar, setCitaSeleccionadaParaAcompanar] = useState<string | null>(null);
  const [modalExitoWhatsApp, setModalExitoWhatsApp] = useState<{
    cita: Cita;
    acompanante: string;
    paciente: Persona;
  } | null>(null);

  // Formularios
  const [nuevaPersona, setNuevaPersona] = useState({
    nombre: '',
    parentesco: '',
    eps: '',
    telefono: '',
    notas: ''
  });

  const [nuevoNieto, setNuevoNieto] = useState({
    nombre: '',
    telefono: ''
  });

  const [nuevaCita, setNuevaCita] = useState({
    persona_id: '',
    especialidad: '',
    doctor: '',
    fecha_hora: '',
    lugar: '',
    direccion: '',
    notas: ''
  });

  // Cargar datos y sincronizar con la URL
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const data = await res.json();
        const listaPersonas: Persona[] = data.personas || [];
        setPersonas(listaPersonas);
        setNietos(data.nietos || []);
        setCitas(data.citas || []);

        // Leer parámetro de URL ?paciente=ID
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const pacienteParam = params.get('paciente');
          if (pacienteParam) {
            const encontrado = listaPersonas.find(p => p.id === pacienteParam || p.nombre.toLowerCase().includes(pacienteParam.toLowerCase()));
            if (encontrado) setPersonaEnPerfil(encontrado);
          }
        }
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Manejar cambio de perfil y actualizar URL
  const seleccionarPerfil = (p: Persona | null) => {
    setPersonaEnPerfil(p);
    setDiaSeleccionado(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (p) {
        url.searchParams.set('paciente', p.id);
      } else {
        url.searchParams.delete('paciente');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  // Copiar link directo al perfil
  const copiarEnlacePerfil = () => {
    if (typeof window !== 'undefined' && personaEnPerfil) {
      const link = `${window.location.origin}?paciente=${personaEnPerfil.id}`;
      navigator.clipboard.writeText(link);
      setMensajeCopiado(true);
      setTimeout(() => setMensajeCopiado(false), 2500);
    }
  };

  // Compartir ficha por WhatsApp
  const compartirFichaWhatsApp = () => {
    if (typeof window !== 'undefined' && personaEnPerfil) {
      const link = `${window.location.origin}?paciente=${personaEnPerfil.id}`;
      const citasPersona = citas.filter(c => c.persona_id === personaEnPerfil.id);
      const texto = `👵 *Citas Médicas de ${personaEnPerfil.nombre}*\n\n` +
        `Tiene ${citasPersona.length} citas programadas.\n` +
        `🔗 Abrí este enlace directo para ver su calendario y postularte como acompañante:\n${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    }
  };

  const sincronizar = async (nuevasPersonas = personas, nuevosNietos = nietos, nuevasCitas = citas) => {
    setGuardando(true);
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personas: nuevasPersonas,
          nietos: nuevosNietos,
          citas: nuevasCitas,
        }),
      });
    } catch (err) {
      console.error('Error sincronizando:', err);
    } finally {
      setGuardando(false);
    }
  };

  // Crear Persona
  const handleGuardarPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaPersona.nombre || !nuevaPersona.parentesco) return;
    const item: Persona = { id: Date.now().toString(), ...nuevaPersona };
    const actualizadas = [...personas, item];
    setPersonas(actualizadas);
    setNuevaPersona({ nombre: '', parentesco: '', eps: '', telefono: '', notas: '' });
    setModalPersonaAbierto(false);
    await sincronizar(actualizadas, nietos, citas);
  };

  // Crear Nieto
  const handleGuardarNieto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNieto.nombre) return;
    const item: Nieto = { id: Date.now().toString(), ...nuevoNieto };
    const actualizados = [...nietos, item];
    setNietos(actualizados);
    setNuevoNieto({ nombre: '', telefono: '' });
    setModalNietoAbierto(false);
    await sincronizar(personas, actualizados, citas);
  };

  // Crear Cita
  const handleGuardarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    const personaIdFinal = nuevaCita.persona_id || personaEnPerfil?.id;
    if (!personaIdFinal || !nuevaCita.especialidad || !nuevaCita.fecha_hora) return;

    const item: Cita = {
      id: Date.now().toString(),
      ...nuevaCita,
      persona_id: personaIdFinal,
      estado: 'pendiente',
      acompanante: ''
    };
    const actualizadas = [...citas, item];
    setCitas(actualizadas);
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
    await sincronizar(personas, nietos, actualizadas);
  };

  // Asignar acompañante y disparar WhatsApp doble
  const asignarAcompanante = async (citaId: string, nombreAcompanante: string) => {
    const citaActual = citas.find(c => c.id === citaId);
    if (!citaActual) return;

    const paciente = personas.find(p => p.id === citaActual.persona_id) || {
      id: '',
      nombre: 'Familiar',
      parentesco: 'Familiar'
    };

    const actualizadas = citas.map(c => 
      c.id === citaId 
        ? { ...c, acompanante: nombreAcompanante, estado: 'acompanada' as const } 
        : c
    );
    setCitas(actualizadas);
    setCitaSeleccionadaParaAcompanar(null);
    await sincronizar(personas, nietos, actualizadas);

    setModalExitoWhatsApp({
      cita: { ...citaActual, acompanante: nombreAcompanante },
      acompanante: nombreAcompanante,
      paciente
    });
  };

  // WhatsApp Grupo Familiar
  const enviarWhatsAppGrupo = (cita: Cita, acompanante: string, paciente: Persona) => {
    const fecha = new Date(cita.fecha_hora).toLocaleString('es-CO', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const linkApp = typeof window !== 'undefined' ? `${window.location.origin}?paciente=${paciente.id}` : '';

    const texto = `✅ *¡Buenas noticias!* ${acompanante} confirmó que acompaña a:\n\n` +
      `👵 *Paciente:* ${paciente.nombre}\n` +
      `🩺 *Especialidad:* ${cita.especialidad}\n` +
      `🗓️ *Fecha:* ${fecha}\n` +
      `📍 *Lugar:* ${cita.lugar} (${cita.direccion || 'Sin dirección'})\n` +
      (cita.notas ? `📝 *Notas:* ${cita.notas}\n` : '') +
      `\n🔗 Ver ficha familiar: ${linkApp}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // WhatsApp Paciente Personal
  const enviarWhatsAppPaciente = (cita: Cita, acompanante: string, paciente: Persona) => {
    const fecha = new Date(cita.fecha_hora).toLocaleString('es-CO', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const texto = `Hola ${paciente.nombre} 👋,\n\n` +
      `Te confirmamos que *${acompanante}* te va a acompañar a tu cita:\n` +
      `🩺 *${cita.especialidad}*\n` +
      `🗓️ *${fecha}*\n` +
      `📍 *${cita.lugar}*\n` +
      (cita.notas ? `📝 *Recomendación:* ${cita.notas}\n` : '') +
      `\n¡Todo listo y organizado! ❤️`;

    const telLimpio = paciente.telefono?.replace(/\D/g, '') || '';
    const link = telLimpio 
      ? `https://wa.me/57${telLimpio}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;

    window.open(link, '_blank');
  };

  // Citas relevantes según si hay perfil activo
  const citasFiltradas = citas.filter(c => {
    const coincidePersona = personaEnPerfil ? c.persona_id === personaEnPerfil.id : true;
    const coincideDia = diaSeleccionado ? c.fecha_hora.startsWith(diaSeleccionado) : true;
    return coincidePersona && coincideDia;
  });

  // Generador de celdas para el Calendario
  const anio = fechaReferencia.getFullYear();
  const mes = fechaReferencia.getMonth();

  let celdasCalendario: Array<{ dia: number; fechaIso: string; nombreDia: string }> = [];

  const formatoIsoFecha = (fecha: Date) => {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const diasSemanaNombres = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  if (modoCalendario === 'semana') {
    const diaActualSemana = fechaReferencia.getDay();
    const distanciaAlLunes = diaActualSemana === 0 ? -6 : 1 - diaActualSemana;
    const lunes = new Date(fechaReferencia);
    lunes.setDate(fechaReferencia.getDate() + distanciaAlLunes);

    for (let i = 0; i < 7; i++) {
      const fechaDia = new Date(lunes);
      fechaDia.setDate(lunes.getDate() + i);
      celdasCalendario.push({
        dia: fechaDia.getDate(),
        fechaIso: formatoIsoFecha(fechaDia),
        nombreDia: diasSemanaNombres[fechaDia.getDay()]
      });
    }
  } else {
    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);
    const diaInicio = primerDiaMes.getDay();
    const offsetLunes = diaInicio === 0 ? 6 : diaInicio - 1;

    for (let i = offsetLunes; i > 0; i--) {
      const f = new Date(anio, mes, 1 - i);
      celdasCalendario.push({
        dia: f.getDate(),
        fechaIso: formatoIsoFecha(f),
        nombreDia: diasSemanaNombres[f.getDay()]
      });
    }

    for (let d = 1; d <= ultimoDiaMes.getDate(); d++) {
      const f = new Date(anio, mes, d);
      celdasCalendario.push({
        dia: d,
        fechaIso: formatoIsoFecha(f),
        nombreDia: diasSemanaNombres[f.getDay()]
      });
    }
  }

  const moverFecha = (direccion: number) => {
    const nueva = new Date(fechaReferencia);
    if (modoCalendario === 'semana') {
      nueva.setDate(nueva.getDate() + (direccion * 7));
    } else {
      nueva.setMonth(nueva.getMonth() + direccion);
    }
    setFechaReferencia(nueva);
  };

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased p-3 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* Toast Notificación Copiado */}
        {mensajeCopiado && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ¡Enlace de {personaEnPerfil?.nombre} copiado al portapapeles!
          </div>
        )}

        {/* Cabecera Principal / Navegación de Perfil con Animación */}
        <header className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
          <div className="flex items-center gap-3">
            {personaEnPerfil ? (
              <button
                onClick={() => seleccionarPerfil(null)}
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl transition flex items-center gap-1 font-bold text-xs"
                title="Volver a toda la familia"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Volver</span>
              </button>
            ) : (
              <span className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl shadow-sm">
                <HeartHandshake className="w-7 h-7" />
              </span>
            )}

            <div key={personaEnPerfil?.id || 'familiar'} className="animate-fade-in">
              {personaEnPerfil ? (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase tracking-wide">
                      Perfil Paciente
                    </span>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {personaEnPerfil.nombre}
                    </h1>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {personaEnPerfil.parentesco} • EPS: {personaEnPerfil.eps || 'No registrada'} 
                    {personaEnPerfil.telefono && ` • Tel: ${personaEnPerfil.telefono}`}
                    {personaEnPerfil.notas && ` • Nota: ${personaEnPerfil.notas}`}
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Citas Médicas Familia</h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Coordinación de salud y acompañantes para los abuelos y tías.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {personaEnPerfil ? (
              <>
                <button 
                  onClick={copiarEnlacePerfil}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition"
                  title="Copiar link para enviar"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  Copiar Enlace
                </button>
                <button 
                  onClick={compartirFichaWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs transition"
                  title="Enviar ficha por WhatsApp"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  Compartir en WhatsApp
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setModalPersonaAbierto(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  + Persona
                </button>
                <button 
                  onClick={() => setModalNietoAbierto(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  + Nieto / Acompañante
                </button>
              </>
            )}
            
            <button 
              onClick={() => {
                if (personaEnPerfil) setNuevaCita({ ...nuevaCita, persona_id: personaEnPerfil.id });
                setModalCitaAbierto(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              + Programar Cita {personaEnPerfil ? `a ${personaEnPerfil.nombre.split(' ')[0]}` : ''}
            </button>
          </div>
        </header>

        {/* Pestañas de Pacientes (Deep Linking con URL) */}
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex items-center justify-between gap-3 overflow-x-auto text-xs">
          <div className="flex items-center gap-2 flex-nowrap">
            <span className="font-bold text-slate-400 uppercase tracking-wider pl-1 text-[11px]">Ver:</span>
            <button 
              onClick={() => seleccionarPerfil(null)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                !personaEnPerfil 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Toda la Familia ({citas.length})
            </button>
            {personas.map(p => {
              const cantCitas = citas.filter(c => c.persona_id === p.id).length;
              const estaActivo = personaEnPerfil?.id === p.id;
              return (
                <button 
                  key={p.id}
                  onClick={() => seleccionarPerfil(p)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    estaActivo 
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30' 
                      : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5 opacity-80" />
                  {p.nombre} ({cantCitas})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {guardando && (
              <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                <RefreshCw className="w-3 h-3 animate-spin" /> Guardando...
              </span>
            )}
            <button 
              onClick={cargarDatos}
              title="Refrescar citas"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CALENDARIO CON TRANSICIÓN SUAVE (SEMANA / MES COMPLETO) */}
        {/* ======================================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {modoCalendario === 'semana' 
                  ? `Semana de ${nombresMeses[mes]} ${anio}` 
                  : `${nombresMeses[mes]} ${anio}`}
              </h2>
              {personaEnPerfil && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg">
                  Solo {personaEnPerfil.nombre}
                </span>
              )}
              {diaSeleccionado && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-slate-900 text-white rounded-full font-semibold">
                  Día: {diaSeleccionado}
                  <button onClick={() => setDiaSeleccionado(null)} className="hover:text-amber-300">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
            </div>

            {/* Controles de vista y navegación */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Interruptor Semana / Mes con animación */}
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-bold">
                <button
                  onClick={() => setModoCalendario('semana')}
                  className={`px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 ${
                    modoCalendario === 'semana' 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Semana
                </button>
                <button
                  onClick={() => setModoCalendario('mes')}
                  className={`px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 ${
                    modoCalendario === 'mes' 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Mes completo
                </button>
              </div>

              {/* Botones de navegación */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => moverFecha(-1)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
                  title={modoCalendario === 'semana' ? 'Semana anterior' : 'Mes anterior'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => moverFecha(1)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition"
                  title={modoCalendario === 'semana' ? 'Semana siguiente' : 'Mes siguiente'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { setFechaReferencia(new Date(2026, 9, 12)); setDiaSeleccionado(null); }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Hoy
                </button>
              </div>
            </div>
          </div>

          {/* Cuadrícula del Calendario con animación expand */}
          <div 
            key={`${modoCalendario}-${fechaReferencia.toISOString()}`} 
            className="grid gap-1.5 sm:gap-2 text-center text-xs grid-cols-7 animate-expand"
          >
            {celdasCalendario.map((celda, idx) => {
              const citasDelDia = citas.filter(c => {
                const coincideFecha = c.fecha_hora.startsWith(celda.fechaIso);
                const coincidePersona = personaEnPerfil ? c.persona_id === personaEnPerfil.id : true;
                return coincideFecha && coincidePersona;
              });

              const esSeleccionado = diaSeleccionado === celda.fechaIso;
              const esHoy = celda.fechaIso === hoyIso;

              return (
                <div
                  key={`${celda.fechaIso}-${idx}`}
                  onClick={() => setDiaSeleccionado(esSeleccionado ? null : celda.fechaIso)}
                  className={`p-2 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                    modoCalendario === 'semana' ? 'min-h-[110px] sm:min-h-[135px]' : 'min-h-[85px] sm:min-h-[105px]'
                  } ${
                    esSeleccionado
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                      : esHoy
                      ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {celda.nombreDia}
                      </span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${
                        esHoy ? 'bg-amber-500 text-white' : 'text-slate-800'
                      }`}>
                        {celda.dia}
                      </span>
                    </div>

                    {citasDelDia.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {citasDelDia.length}
                      </span>
                    )}
                  </div>

                  {/* Pastillas de citas */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {citasDelDia.map(c => {
                      const paciente = personas.find(p => p.id === c.persona_id);
                      const hora = new Date(c.fecha_hora).toLocaleTimeString('es-CO', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      });
                      const estaAcompanada = Boolean(c.acompanante);

                      return (
                        <div
                          key={c.id}
                          className={`px-1.5 py-1 rounded-xl text-[10px] font-semibold border leading-tight transition ${
                            estaAcompanada
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                          }`}
                          title={`${c.especialidad} - ${paciente?.nombre} (${hora})`}
                        >
                          <div className="flex items-center justify-between gap-0.5">
                            <span className="truncate">{c.especialidad.split(' ')[0]}</span>
                            <span className="text-[9px] text-slate-500 font-normal shrink-0">{hora}</span>
                          </div>
                          {!personaEnPerfil && (
                            <div className="text-[9px] font-normal truncate opacity-80 mt-0.5">
                              {paciente?.nombre?.split(' ')[0]}
                            </div>
                          )}
                          <div className="text-[9px] truncate font-bold mt-0.5">
                            {estaAcompanada ? `✅ ${c.acompanante}` : '⚠️ Sin nieto'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* LISTADO DE TARJETAS DE CITAS CON ANIMACIÓN FADE-IN       */}
        {/* ======================================================== */}
        <div key={personaEnPerfil?.id || 'todas-citas'} className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              {personaEnPerfil 
                ? `Citas de ${personaEnPerfil.nombre}` 
                : 'Todas las Citas Médicas'} 
              {diaSeleccionado ? ` (${diaSeleccionado})` : ''}
            </h2>
            {diaSeleccionado && (
              <button 
                onClick={() => setDiaSeleccionado(null)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Ver todas las fechas
              </button>
            )}
          </div>

          {citasFiltradas.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-300">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-medium text-sm">
                No hay citas registradas {personaEnPerfil ? `para ${personaEnPerfil.nombre}` : ''} {diaSeleccionado ? `en esta fecha` : ''}.
              </p>
              <button
                onClick={() => {
                  if (personaEnPerfil) setNuevaCita({ ...nuevaCita, persona_id: personaEnPerfil.id });
                  setModalCitaAbierto(true);
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Programar Cita Ahora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {citasFiltradas.map(cita => {
                const paciente = personas.find(p => p.id === cita.persona_id);
                const fechaObj = new Date(cita.fecha_hora);
                const fechaFormateada = fechaObj.toLocaleDateString('es-CO', { 
                  weekday: 'long', 
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
                    className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all duration-200"
                  >
                    <div className="space-y-3">
                      {/* Cabecera con clic para entrar al perfil del paciente */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                            {cita.especialidad}
                          </span>
                          
                          {/* Botón hacia el perfil del paciente con deep link */}
                          <button
                            onClick={() => {
                              if (paciente) seleccionarPerfil(paciente);
                            }}
                            className="text-left group block mt-1"
                            title="Hacé clic para ver el perfil y calendario exclusivo de esta persona"
                          >
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                              {paciente?.nombre || 'Familiar'}
                              <span className="text-[11px] font-normal text-blue-500 opacity-0 group-hover:opacity-100 transition">
                                (Ver perfil 👤)
                              </span>
                            </h3>
                            <p className="text-xs text-slate-500">
                              {paciente?.parentesco} • EPS: {paciente?.eps || 'No registrada'}
                            </p>
                          </button>
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

                      {/* Detalles de la cita */}
                      <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-900 capitalize">{fechaFormateada}</span> a las <span className="font-semibold text-slate-900">{horaFormateada}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{cita.lugar}</span>
                          {cita.direccion && (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cita.lugar + ' ' + cita.direccion)}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center ml-1"
                            >
                              Maps <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                          )}
                        </div>
                        {cita.doctor && (
                          <div className="text-slate-500 pl-6">
                            Doctor: {cita.doctor}
                          </div>
                        )}
                        {cita.notas && (
                          <div className="text-slate-600 font-medium pl-6 italic bg-amber-50/50 p-1.5 rounded-lg border border-amber-100">
                            💡 {cita.notas}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selector de acompañante si se abre */}
                    {citaSeleccionadaParaAcompanar === cita.id && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 animate-fade-in">
                        <p className="text-xs font-bold text-emerald-900">¿Quién va a acompañar?</p>
                        <div className="flex flex-wrap gap-1.5">
                          {nietos.map(n => (
                            <button
                              key={n.id}
                              onClick={() => asignarAcompanante(cita.id, n.nombre)}
                              className="px-2.5 py-1 bg-white hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition"
                            >
                              Yo ({n.nombre})
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              const otro = prompt('Escribí tu nombre:');
                              if (otro) asignarAcompanante(cita.id, otro);
                            }}
                            className="px-2.5 py-1 bg-emerald-200 hover:bg-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold"
                          >
                            + Otro nombre
                          </button>
                        </div>
                        <button
                          onClick={() => setCitaSeleccionadaParaAcompanar(null)}
                          className="text-[11px] text-slate-500 hover:underline block pt-1"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                      {!tieneAcompanante ? (
                        <button
                          onClick={() => setCitaSeleccionadaParaAcompanar(cita.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          <UserCheck className="w-4 h-4" />
                          Yo acompaño
                        </button>
                      ) : (
                        <button
                          onClick={() => setCitaSeleccionadaParaAcompanar(cita.id)}
                          className="text-xs text-slate-500 hover:text-slate-800 underline"
                        >
                          Cambiar acompañante
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const pac = personas.find(p => p.id === cita.persona_id) || { id: '', nombre: 'Familiar', parentesco: 'Familiar' };
                          enviarWhatsAppGrupo(cita, cita.acompanante || 'Familiar', pac);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-200"
                        title="Enviar a grupo de WhatsApp"
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

        {/* ======================================================== */}
        {/* MODAL CONFIRMACIÓN DOBLE WHATSAPP TRAS POSTULARSE        */}
        {/* ======================================================== */}
        {modalExitoWhatsApp && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900">¡Asignado como Acompañante!</h3>
                </div>
                <button 
                  onClick={() => setModalExitoWhatsApp(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Quedaste asignado/a para acompañar a <strong>{modalExitoWhatsApp.paciente.nombre}</strong> el{' '}
                <strong>{new Date(modalExitoWhatsApp.cita.fecha_hora).toLocaleDateString('es-CO')}</strong>. ¿A quién querés notificar por WhatsApp?
              </p>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    enviarWhatsAppGrupo(
                      modalExitoWhatsApp.cita,
                      modalExitoWhatsApp.acompanante,
                      modalExitoWhatsApp.paciente
                    );
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-sm transition"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    1. Enviar al Grupo Familiar de WhatsApp
                  </span>
                  <span>👉</span>
                </button>

                <button
                  onClick={() => {
                    enviarWhatsAppPaciente(
                      modalExitoWhatsApp.cita,
                      modalExitoWhatsApp.acompanante,
                      modalExitoWhatsApp.paciente
                    );
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition border border-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    2. Enviar a {modalExitoWhatsApp.paciente.nombre} (Directo)
                  </span>
                  <span>📲</span>
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setModalExitoWhatsApp(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Listo, cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Persona */}
        {modalPersonaAbierto && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-3">Agregar Familiar / Paciente</h3>
              <form onSubmit={handleGuardarPersona} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    placeholder="ej: Abuelita Bertha" 
                    required 
                    value={nuevaPersona.nombre}
                    onChange={e => setNuevaPersona({ ...nuevaPersona, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Parentesco</label>
                  <input 
                    type="text" 
                    placeholder="ej: Abuelita, Tía, Mamá" 
                    required 
                    value={nuevaPersona.parentesco}
                    onChange={e => setNuevaPersona({ ...nuevaPersona, parentesco: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">EPS / Seguro</label>
                  <input 
                    type="text" 
                    placeholder="ej: Salud Total, Compensar" 
                    value={nuevaPersona.eps}
                    onChange={e => setNuevaPersona({ ...nuevaPersona, eps: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono Celular (para WhatsApp)</label>
                  <input 
                    type="text" 
                    placeholder="ej: 3142502868" 
                    value={nuevaPersona.telefono}
                    onChange={e => setNuevaPersona({ ...nuevaPersona, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notas especiales</label>
                  <input 
                    type="text" 
                    placeholder="ej: Requiere transporte, no caminar mucho" 
                    value={nuevaPersona.notas}
                    onChange={e => setNuevaPersona({ ...nuevaPersona, notas: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setModalPersonaAbierto(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Nieto */}
        {modalNietoAbierto && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-3">Agregar Nieto / Acompañante</h3>
              <form onSubmit={handleGuardarNieto} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    placeholder="ej: Pocho, Viviana, Paula" 
                    required 
                    value={nuevoNieto.nombre}
                    onChange={e => setNuevoNieto({ ...nuevoNieto, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="ej: 3001234567" 
                    value={nuevoNieto.telefono}
                    onChange={e => setNuevoNieto({ ...nuevoNieto, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setModalNietoAbierto(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Cita */}
        {modalCitaAbierto && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Programar Cita Médica {personaEnPerfil ? `para ${personaEnPerfil.nombre}` : ''}
              </h3>
              <form onSubmit={handleGuardarCita} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Paciente</label>
                  <select 
                    required 
                    value={nuevaCita.persona_id || personaEnPerfil?.id || ''}
                    onChange={e => setNuevaCita({ ...nuevaCita, persona_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar familiar...</option>
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.parentesco})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Especialidad</label>
                  <input 
                    type="text" 
                    placeholder="ej: Oftalmología, Cardiología, Exámenes" 
                    required 
                    value={nuevaCita.especialidad}
                    onChange={e => setNuevaCita({ ...nuevaCita, especialidad: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha y Hora</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={nuevaCita.fecha_hora}
                    onChange={e => setNuevaCita({ ...nuevaCita, fecha_hora: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lugar / Sede</label>
                  <input 
                    type="text" 
                    placeholder="ej: Oftalmohelp-Univer, Forest Medical Center" 
                    required 
                    value={nuevaCita.lugar}
                    onChange={e => setNuevaCita({ ...nuevaCita, lugar: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección</label>
                  <input 
                    type="text" 
                    placeholder="ej: Cra 7B Bis # 132-38 Piso 7" 
                    value={nuevaCita.direccion}
                    onChange={e => setNuevaCita({ ...nuevaCita, direccion: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="ej: Dr. Hector Hugo Lopez" 
                    value={nuevaCita.doctor}
                    onChange={e => setNuevaCita({ ...nuevaCita, doctor: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notas especiales (Copago, ayuno, etc.)</label>
                  <input 
                    type="text" 
                    placeholder="ej: Copago $29.200 en la IPS" 
                    value={nuevaCita.notas}
                    onChange={e => setNuevaCita({ ...nuevaCita, notas: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setModalCitaAbierto(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                  >
                    Guardar
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
