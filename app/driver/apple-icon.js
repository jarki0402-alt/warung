import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
        }}
      >
        <svg width="86" height="86" viewBox="0 0 24 24" fill="#fff">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
