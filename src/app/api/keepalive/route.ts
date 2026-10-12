import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  const timestamp = new Date().toISOString();

  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({
      status: 'skipped',
      message: 'Supabase no está configurado aún en las variables de entorno.',
      timestamp,
    });
  }

  try {
    // Consulta ligera para mantener activa la base de datos de Supabase
    const { data, error } = await supabase
      .from('personas')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        error: error.message,
        timestamp,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'active',
      message: 'Supabase keepalive ping exitoso. Base de datos activa y despierta.',
      count: data?.length ?? 0,
      timestamp,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      error: err.message,
      timestamp,
    }, { status: 500 });
  }
}
