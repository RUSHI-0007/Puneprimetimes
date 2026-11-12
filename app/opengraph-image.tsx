import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Pune Prime Times | सत्य. वेग. विश्वास.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '22px',
              background: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '52px',
              fontWeight: 900,
              color: '#ffffff',
            }}
          >
            P
          </div>
          <span
            style={{
              fontSize: '68px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-2px',
            }}
          >
            Pune Prime Times
          </span>
        </div>
        <p
          style={{
            fontSize: '26px',
            color: '#f87171',
            fontWeight: 700,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          सत्य. वेग. विश्वास. | Truth. Speed. Insight.
        </p>
        <p
          style={{
            fontSize: '22px',
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '860px',
            lineHeight: 1.5,
          }}
        >
          पुणे, बारामती, पिंपरी-चिंचवड आणि महाराष्ट्रातील ताज्या आणि विश्‍वासार्ह घडामोडींचे स्वतंत्र डिजिटल बातमीपत्र
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}

