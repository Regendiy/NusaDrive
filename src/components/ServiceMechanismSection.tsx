export function ServiceMechanismSection() {
  const steps = [
    {
      num: '01.',
      title: 'Cek Jadwal & Titik Jemput Batam',
      detail:
        'Pilih titik serah terima di Bandara Hang Nadim, Pelabuhan Ferry Batam Centre, Harbour Bay, Nagoya, atau Nongsa. Sistem memverifikasi bentrok jadwal beserta kalkulasi PPN 11% secara otomatis.',
    },
    {
      num: '02.',
      title: 'Pembayaran Gateway & Struk Resmi',
      detail:
        'Bayar melalui QRIS atau Virtual Account. Status langsung lunas tanpa verifikasi manual dan struk pembayaran digital siap dicetak maupun diunduh.',
    },
    {
      num: '03.',
      title: 'Notifikasi WhatsApp Real-Time',
      detail:
        'Setiap pemesanan baru, konfirmasi pelunasan, kesiapan unit di Batam, hingga pengembalian kendaraan dikirim langsung ke WhatsApp pelanggan.',
    },
  ];

  const metrics = [
    { value: '15 Menit', label: 'Rata-rata waktu serah terima unit di terminal ferry & Bandara Hang Nadim' },
    { value: '99,4%', label: 'Tingkat ketepatan jadwal pengantaran armada di seluruh Pulau Batam' },
    { value: '< 3 Detik', label: 'Penerbitan struk lunas otomatis dan pengiriman notifikasi WhatsApp' },
  ];

  return (
    <section id="alur-sewa" className="py-16 bg-slate-950 dark:bg-slate-900/90 text-white border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-blue-400 mb-2">Standar Operasional Batam</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
              Alur Pemesanan Cepat, Transparan, dan Terukur
            </h2>
            <p className="mt-3 text-base text-slate-300 leading-relaxed">
              Dirancang untuk tamu bisnis lintas pelabuhan Singapura–Batam maupun perjalanan keluarga tanpa administrasi berbelit. Seluruh transaksi dan struk tercatat rapi.
            </p>

            {/* Claim-to-Proof Adjacency */}
            <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-5 pt-6 border-t border-slate-800">
              {metrics.map((m) => (
                <div key={m.value}>
                  <dt className="font-mono text-2xl font-bold text-white tabular-nums">
                    {m.value}
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-400">{m.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-7 divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-900/70 dark:bg-slate-950/70">
            {steps.map((step) => (
              <div key={step.num} className="p-6 sm:p-7 flex flex-col sm:flex-row gap-4 sm:gap-6">
                <span className="font-mono text-lg font-semibold text-blue-400 tabular-nums shrink-0">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
