import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface Persona {
  id: string;
  nombre: string;
  parentesco: string;
  eps?: string;
  telefono?: string;
  notas?: string;
}

export interface Cita {
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
  persona?: Persona;
}
