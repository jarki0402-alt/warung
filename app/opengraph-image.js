import { ImageResponse } from 'next/og';
import { getSettings } from '@/lib/storage';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const settings = await getSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2e5e39',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.12) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255,255,255,0.12) 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 90 }}>🥗</div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 64,
            fontWeight: 800,
            color: '#fffdf9',
            textAlign: 'center',
          }}
        >
          {settings.namaWarung}
        </div>
        {settings.tagline && (
          <div
            style={{
              display: 'flex',
              marginTop: 20,
              fontSize: 32,
              color: '#e7a83c',
              textAlign: 'center',
              maxWidth: 900,
            }}
          >
            {settings.tagline}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
