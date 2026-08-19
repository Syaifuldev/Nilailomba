import { createClient } from '@/lib/supabase/server'
import PrintButton from '@/components/ui/PrintButton'

export default async function PrintRekapPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('competition_settings').select('*').single()
  
  const { data: allScores } = await supabase
    .from('participant_scores_view')
    .select('*')
    .order('participant_number', { ascending: true })

  const filtered = (allScores || []).filter(s => s.score_status !== 'belum')
  
  const maxWudu = filtered.length > 0 ? Math.max(...filtered.map(r => r.wudu_judge_count || 1)) * 100 : 100;
  const maxSalat = filtered.length > 0 ? Math.max(...filtered.map(r => r.salat_judge_count || 1)) * 250 : 250;
  const maxTotal = maxWudu + maxSalat;

  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '0', background: 'white' }}>
      {/* Print button */}
      <div className="no-print" style={{ padding: '16px', textAlign: 'right' }}>
        <PrintButton />
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
          {settings?.competition_name ?? 'SISTEM PENILAIAN LOMBA MAPSI'}
        </h1>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>
          REKAPITULASI NILAI PESERTA
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
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', width: '40px' }}>No</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Nomor Peserta</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Wudu<br />(Maks {maxWudu})</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Salat<br />(Maks {maxSalat})</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Total<br />(Maks {maxTotal})</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Persentase</th>
            <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={r.participant_id} style={{ background: 'white' }}>
              <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'center', color: '#64748b' }}>
                {i + 1}
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
              <td style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'center', color: r.score_status === 'selesai' ? '#15803d' : '#b45309' }}>
                {r.score_status === 'selesai' ? 'Final' : 'Sebagian'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f8fafc' }}>
            <td colSpan={7} style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'right', fontSize: '10px', color: '#64748b' }}>
              Total data: {filtered.length} | Dicetak dari Sistem Penilaian Lomba MAPSI
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
