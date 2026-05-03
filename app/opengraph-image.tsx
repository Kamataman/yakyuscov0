import { ImageResponse } from 'next/og'
import { APP_NAME } from '@/lib/constants'

export const runtime = 'edge'
export const alt = `${APP_NAME} - 野球チームの成績管理アプリ`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
          background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1.1,
            }}
          >
            {APP_NAME}
          </div>
          <div
            style={{
              fontSize: '36px',
              color: '#94a3b8',
              textAlign: 'center',
            }}
          >
            野球チームの試合結果と個人成績を簡単管理
          </div>
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              gap: '16px',
            }}
          >
            {['試合スコア記録', '打率・OPS自動計算', '投手成績管理'].map((label) => (
              <div
                key={label}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  color: '#93c5fd',
                  fontSize: '22px',
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '24px',
              background: '#2563eb',
              borderRadius: '12px',
              padding: '14px 40px',
              color: 'white',
              fontSize: '26px',
              fontWeight: 'bold',
            }}
          >
            無料で始める
          </div>
        </div>
      </div>
    ),
    size,
  )
}
