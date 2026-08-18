import { createClient } from '@/lib/supabase/server'
import { getRankedParticipants } from '@/services/scoring-calc'

export default async function PrintRankingPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('competition_settings').select('*').single()
  const ranked = await getRankedParticipants()
  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '0', background: 'white' }}>
      {/* Print button */}
      <div className="no-print" style={{ padding: '16px', textAlign: 'right' }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
        >
          🖨 Cetak / PDF
        </button>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
          {settings?.competition_name ?? 'SISTEM PENILAIAN LOMBA MAPSI'}
        </h1>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>
          DAFTAR RANKING PESERTA
        </h2>
        <p style={{ fontSize: '11px', color: '#555', margin: '2px 0' }}>
          {settings?.organizer_name} — Tahun {settings?.competition_year ?? new Date().getFullYear()}
        </p>
        <p style={{ fontSize: '11px', color: '#555', margin: '2px 0' }}>
          Dicetak: {now}
        </p>
        <hr style={{ margin: '10px 0', borderTop: '2px solid #333' }} />
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Ranking</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Nomor Peserta</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Nilai Wudu<br />(Maks 100)</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Nilai Salat<br />(Maks 250)</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Total Nilai<br />(Maks 350)</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Persentase</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r) => (
            <tr key={r.participant_id} style={{ background: r.ranking <= 3 ? '#fefce8' : 'white' }}>
              <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                {r.ranking === 1 ? '🥇' : r.ranking === 2 ? '🥈' : r.ranking === 3 ? '🥉' : r.ranking}
              </td>
              <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px' }}>
                {r.participant_number}
              </td>
              <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'center' }}>{r.wudu_score}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'center' }}>{r.salat_score}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>{r.total_score}</td>
              <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: r.percentage >= 90 ? '#16a34a' : '#2563eb' }}>
                {r.percentage}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f8fafc' }}>
            <td colSpan={6} style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right', fontSize: '10px', color: '#64748b' }}>
              Total peserta: {ranked.length} | Dicetak dari Sistem Penilaian Lomba MAPSI
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Signature area */}
      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'center', minWidth: '200px' }}>
          <p style={{ fontSize: '11px', margin: 0 }}>Mengetahui,</p>
          <p style={{ fontSize: '11px', margin: '2px 0' }}>{settings?.organizer_name ?? 'Panitia Lomba'}</p>
          <div style={{ height: '50px' }} />
          <p style={{ fontSize: '11px', borderTop: '1px solid #333', paddingTop: '4px', margin: 0 }}>
            (______________________________)
          </p>
        </div>
      </div>
    </div>
  )
}
