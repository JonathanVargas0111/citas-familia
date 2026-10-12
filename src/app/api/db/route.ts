import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GIST_ID = process.env.GIST_ID || '';
const FILENAME = 'citas_familia_db.json';

export async function GET() {
  if (!GITHUB_TOKEN || !GIST_ID) {
    return NextResponse.json({ error: 'Configuración de base de datos no encontrada' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`GitHub Gist API error: ${res.statusText}`);
    }

    const data = await res.json();
    const files = Object.values(data.files || {}) as any[];
    const fileContent = files[0]?.content;
    const firstFileName = Object.keys(data.files || {})[0] || FILENAME;

    if (!fileContent) {
      return NextResponse.json({ personas: [], nietos: [], citas: [] });
    }

    return NextResponse.json(JSON.parse(fileContent));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!GITHUB_TOKEN || !GIST_ID) {
    return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 500 });
  }

  try {
    const body = await req.json();

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'citas_init.json': {
            content: JSON.stringify(body, null, 2),
          },
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Error actualizando Gist: ${res.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
