import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2e5e39',
          borderRadius: 16,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
