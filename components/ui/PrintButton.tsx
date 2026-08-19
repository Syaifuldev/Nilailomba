'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '8px 20px',
        background: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      🖨 Cetak / PDF
    </button>
  )
}
