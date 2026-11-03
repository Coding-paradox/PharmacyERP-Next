export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-white shadow-lg shadow-teal-950/15 ring-1 ring-teal-950/10 ${compact ? 'h-12 w-12 sm:h-14 sm:w-14' : 'h-16 w-16'}`}>
      <img src="/icons/pharmacy-emblem.svg" alt="" className={`object-contain ${compact ? 'h-10 w-10 sm:h-12 sm:w-12' : 'h-14 w-14'}`} />
    </span>
  );
}

export function StartupScreen({ message = 'Préparation de votre espace', indeterminate = false }: { message?: string; indeterminate?: boolean }) {
  return (
    <main className="startup-screen fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f9f8] px-6">
      <div className="startup-orb startup-orb-one" />
      <div className="startup-orb startup-orb-two" />
      <section className="relative z-10 w-full max-w-sm text-center" aria-label="Démarrage de MULANGO Healthcare">
        <BrandMark />
        <p className="mt-5 text-2xl font-bold tracking-tight text-teal-950">MULANGO <span className="font-medium text-teal-700">Healthcare</span></p>
        <p className="mt-1 text-sm text-slate-500">Gestion pharmaceutique</p>
        <div className="startup-progress-track mt-8" role="progressbar" aria-label="Chargement de l’application" aria-valuemin={0} aria-valuemax={100}>
          <span className={`startup-progress-fill${indeterminate ? ' startup-progress-indeterminate' : ''}`} />
        </div>
        <p className="mt-3 text-xs font-medium tracking-wide text-slate-600">{message}</p>
      </section>
    </main>
  );
}
