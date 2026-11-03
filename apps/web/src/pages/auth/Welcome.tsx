import { useRef, useState } from 'react';
import {
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Layers,
  Menu,
  MonitorSmartphone,
  PackageCheck,
  Pill,
  Settings,
  ShieldCheck,
  ShoppingCart,
  X,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const featureTiles = [
  { icon: Pill, label: 'Médicaments', href: '#fonctionnalites' },
  { icon: ShoppingCart, label: 'Achats & ventes', href: '#solutions' },
  { icon: PackageCheck, label: 'Stocks & lots', href: '#fonctionnalites' },
  { icon: ClipboardList, label: 'Rapports', href: '#solutions' },
];

const scenes = [
  { title: 'Pharmacie', kind: 'pharmacy' as const },
  { title: 'Dépôt pharmaceutique', kind: 'depot' as const },
  { title: 'Laboratoire', kind: 'laboratory' as const },
];

function SceneArt({ kind }: { kind: (typeof scenes)[number]['kind'] }) {
  const image = kind === 'pharmacy'
    ? '/images/landing/pharmacy-team.png'
    : kind === 'depot'
      ? '/images/landing/pharmaceutical-depot.png'
      : '/images/landing/pharmaceutical-laboratory.png';
  const imageAlt = kind === 'pharmacy'
    ? 'Pharmaciennes conseillant une cliente dans une pharmacie'
    : kind === 'depot'
      ? 'Entrepôt de stockage et de distribution pharmaceutique'
      : 'Personnel de laboratoire analysant des échantillons médicaux';
  const imagePosition = kind === 'depot' ? 'center 47%' : kind === 'pharmacy' ? 'center 43%' : 'center 48%';
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#dceceb]">
      <img src={image} alt={imageAlt} className="h-full w-full object-cover" style={{ objectPosition: imagePosition }} />
    </div>
  );
}

export function Welcome() {
  const { isAuthenticated } = useAuth();
  const [activeScene, setActiveScene] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const accountLink = isAuthenticated ? '/dashboard' : '/login';
  const selectedScene = scenes[activeScene];

  const moveScene = (direction: number) => {
    setActiveScene((current) => (current + direction + scenes.length) % scenes.length);
  };

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f7fbfc] text-slate-900">
      <header className="relative z-30 border-b border-slate-200/70 bg-white/90 shadow-[0_5px_24px_rgba(14,54,70,.04)] backdrop-blur">
        <div className="mx-auto flex min-h-[78px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8 xl:px-14">
          <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="MULANGO Healthcare, accueil">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(4,67,64,.11)] ring-1 ring-teal-950/5 sm:h-16 sm:w-16">
              <img src="/icons/pharmacy-emblem.svg" alt="" className="h-10 w-10 object-contain sm:h-14 sm:w-14" />
            </span>
            <span className="flex items-center gap-3 sm:gap-5">
              <span className="text-sm font-extrabold leading-[1.02] tracking-tight text-teal-950 sm:text-[1.35rem]">MULANGO<br className="sm:hidden" /> <span className="font-semibold">Healthcare</span></span>
              <span className="hidden h-10 w-px bg-slate-300 sm:block" />
              <span className="hidden text-sm font-semibold text-slate-700 lg:block xl:text-base">Gestion pharmaceutique</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex xl:gap-9" aria-label="Navigation principale">
            <a href="#accueil" className="border-b-[3px] border-teal-700 py-3 text-sm font-bold text-teal-800 xl:text-base">Accueil</a>
            <a href="#fonctionnalites" className="py-3 text-sm font-semibold text-slate-800 transition hover:text-teal-700 xl:text-base">Fonctionnalités</a>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 py-3 text-sm font-semibold text-slate-800 transition hover:text-teal-700 xl:text-base">
                Solutions <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
              </summary>
              <div className="absolute left-0 top-full z-50 w-60 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-900/10">
                <a href="#solutions" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900">Pharmacies</a>
                <a href="#solutions" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900">Dépôts pharmaceutiques</a>
                <a href="#solutions" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900">Établissements de santé</a>
              </div>
            </details>
            <a href="#apropos" className="py-3 text-sm font-semibold text-slate-800 transition hover:text-teal-700 xl:text-base">À propos</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <button type="button" title="Notifications disponibles après connexion" aria-label="Notifications disponibles après connexion" className="relative hidden h-11 w-11 items-center justify-center rounded-full text-teal-950 transition hover:bg-teal-50 sm:inline-flex">
              <Bell className="h-6 w-6" /><span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal-600" />
            </button>
            <Link to={accountLink} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-teal-800 to-teal-700 px-3 text-xs font-bold text-white shadow-lg shadow-teal-900/20 transition hover:-translate-y-0.5 hover:from-teal-900 hover:to-teal-800 sm:h-11 sm:gap-2 sm:px-6 sm:text-base">
              <span className="hidden sm:inline">{isAuthenticated ? 'Mon espace' : 'Se connecter'}</span><span className="sm:hidden">Connexion</span><ArrowRight className="hidden h-4 w-4 sm:block" />
            </Link>
            <button type="button" aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-teal-950 hover:bg-teal-50 lg:hidden sm:h-11 sm:w-11">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && <nav className="grid gap-1 border-t border-slate-100 bg-white px-5 py-3 lg:hidden" aria-label="Navigation mobile">
          {[['Accueil', '#accueil'], ['Fonctionnalités', '#fonctionnalites'], ['Solutions', '#solutions'], ['À propos', '#apropos']].map(([label, href]) => <a key={label} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-teal-50">{label}</a>)}
        </nav>}
      </header>

      <section id="accueil" className="relative mx-auto grid max-w-[1600px] items-center gap-4 overflow-hidden px-4 pb-8 pt-4 sm:px-8 md:pb-10 md:pt-8 lg:min-h-[590px] lg:grid-cols-[minmax(300px,.35fr)_minmax(0,.65fr)] lg:gap-3 xl:px-14">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <img src="/images/landing/pharmaceutical-depot.png" alt="" className="h-full w-full object-cover object-center" />
          <span className="absolute inset-0 bg-gradient-to-r from-[#003c39]/85 via-[#004d48]/60 to-[#003f3c]/30" />
          <span className="absolute inset-0 bg-[#003c39]/10" />
        </div>
        <div className="relative z-10 flex min-h-[310px] flex-col items-center justify-end px-5 pb-6 pt-8 sm:min-h-[390px] sm:px-8 sm:pb-8 lg:min-h-[470px] lg:items-start lg:justify-between lg:px-8 lg:py-9 xl:px-10">
          <div className="relative z-10 hidden w-full lg:block">
            <p className="text-xs font-bold uppercase tracking-[.19em] text-teal-100">L’essentiel de votre activité</p>
            <h1 className="mt-4 max-w-[18rem] text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">La gestion pharmaceutique, au même endroit.</h1>
          </div>
          <div className="relative z-10 flex w-full flex-wrap justify-center gap-3 lg:justify-start">
            <Link to={accountLink} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-800 to-teal-700 px-5 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:-translate-y-0.5 hover:from-teal-900 hover:to-teal-800 sm:px-8 sm:text-base">
              {isAuthenticated ? 'Accéder à mon espace' : 'Accéder à mon espace'} <ArrowRight className="h-4 w-4" />
            </Link>
            {!isAuthenticated && <Link to="/setup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-teal-800 bg-white/85 px-5 text-sm font-bold text-teal-950 shadow-sm transition hover:bg-teal-50 sm:px-7 sm:text-base">
              <Settings className="h-4 w-4" /> Première installation
            </Link>}
          </div>
        </div>

        <div className="relative min-w-0" role="region" aria-roledescription="carrousel" aria-label="Solutions de santé">
          <div className="relative hidden h-[430px] md:block lg:h-[470px] xl:h-[525px]">
            {scenes.map((scene, index) => {
              const relative = (index - activeScene + scenes.length) % scenes.length;
              const positions = [
                'left-[17%] top-[7%] z-20 h-[84%] w-[52%] rotate-[-2deg] shadow-2xl shadow-teal-950/20',
                'left-[58%] top-[19%] z-10 h-[68%] w-[39%] rotate-[7deg] shadow-xl shadow-teal-950/15',
                'left-[1%] top-[20%] z-0 h-[66%] w-[39%] rotate-[-8deg] shadow-lg shadow-teal-950/10',
              ];
              const position = relative === 0 ? positions[0] : relative === 1 ? positions[1] : positions[2];
              return <button key={scene.kind} type="button" onClick={() => setActiveScene(index)} aria-label={`Afficher ${scene.title}`} aria-pressed={relative === 0} className={`absolute overflow-hidden rounded-[2rem] border-[7px] border-white bg-white transition duration-500 ease-out hover:z-30 hover:scale-[1.025] ${position}`}>
                <SceneArt kind={scene.kind} />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-teal-950/85 via-teal-950/35 to-transparent px-5 pb-5 pt-14 text-left text-base font-extrabold tracking-wide text-white xl:text-lg">{scene.title}</span>
              </button>;
            })}
            <button type="button" onClick={() => moveScene(-1)} aria-label="Visuel précédent" className="absolute left-[1%] top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-white text-teal-950 shadow-lg transition hover:scale-105 hover:bg-teal-50"><ChevronLeft className="h-7 w-7" /></button>
            <button type="button" onClick={() => moveScene(1)} aria-label="Visuel suivant" className="absolute right-[1%] top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-white text-teal-950 shadow-lg transition hover:scale-105 hover:bg-teal-50"><ChevronRight className="h-7 w-7" /></button>
          </div>
          <div
            className="relative mt-5 h-[clamp(230px,62vw,340px)] overflow-hidden rounded-[1.5rem] border-[5px] border-white bg-white shadow-xl md:hidden"
            onTouchStart={(event) => { swipeStartX.current = event.touches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => {
              const startX = swipeStartX.current;
              const endX = event.changedTouches[0]?.clientX;
              swipeStartX.current = null;
              if (startX == null || endX == null) return;
              if (startX - endX > 45) moveScene(1);
              if (endX - startX > 45) moveScene(-1);
            }}
          >
            <SceneArt kind={selectedScene.kind} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-teal-950/65 via-transparent to-teal-950/10" />
            <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-teal-950 shadow-sm">MULANGO Healthcare</span>
            <button type="button" onClick={() => moveScene(-1)} aria-label="Visuel précédent" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/95 text-teal-950 shadow-lg transition active:scale-95"><ChevronLeft className="h-6 w-6" /></button>
            <button type="button" onClick={() => moveScene(1)} aria-label="Visuel suivant" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/95 text-teal-950 shadow-lg transition active:scale-95"><ChevronRight className="h-6 w-6" /></button>
            <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-3 text-white">
              <span className="text-xl font-extrabold tracking-tight drop-shadow sm:text-2xl">{selectedScene.title}</span>
              <span className="shrink-0 rounded-full border border-white/45 bg-teal-950/35 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">{activeScene + 1} / {scenes.length}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3 lg:mt-[-2px]">
            {scenes.map((scene, index) => <button key={scene.kind} type="button" onClick={() => setActiveScene(index)} aria-label={`Afficher le visuel ${index + 1} : ${scene.title}`} aria-current={activeScene === index ? 'true' : undefined} className={`h-3 rounded-full transition-all ${activeScene === index ? 'w-8 bg-teal-700' : 'w-3 bg-teal-900/25 hover:bg-teal-700/50'}`} />)}
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="mx-auto grid max-w-[1450px] grid-cols-2 gap-3 px-4 pb-10 sm:gap-5 sm:px-8 lg:grid-cols-4 lg:gap-7 xl:px-14">
        {featureTiles.map(({ icon: Icon, label, href }, index) => <a key={label} href={href} className="group flex min-h-[92px] items-center justify-center gap-3 rounded-[1.4rem] border border-white bg-white/85 px-3 text-center shadow-[0_10px_30px_rgba(8,67,74,.10)] backdrop-blur transition hover:-translate-y-1 hover:border-teal-100 hover:shadow-[0_16px_34px_rgba(8,67,74,.14)] sm:min-h-[108px] sm:gap-4 sm:rounded-[1.8rem] sm:px-5">
          <Icon className={`h-7 w-7 shrink-0 text-teal-700 transition group-hover:scale-110 sm:h-9 sm:w-9 ${index === 1 ? 'stroke-[2.3]' : ''}`} />
          <span className="text-sm font-extrabold leading-tight text-teal-950 sm:text-base lg:text-lg">{label}</span>
        </a>)}
      </section>

      <section id="solutions" className="relative overflow-hidden bg-[#003f3c] text-white">
        <svg className="absolute inset-x-0 top-0 h-12 w-full -translate-y-[90%]" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70C260 5 480 20 710 58s470 55 730-34v76H0Z" fill="#003f3c" /></svg>
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-y-6 px-5 py-7 sm:grid-cols-4 sm:gap-0 sm:px-8 sm:py-8" id="apropos">
          {[
            { icon: ShieldCheck, label: 'Sécurité', tone: 'text-teal-100' },
            { icon: Zap, label: 'Rapidité', tone: 'text-amber-300' },
            { icon: MonitorSmartphone, label: 'Multiplateforme', tone: 'text-cyan-200' },
            { icon: Layers, label: 'Évolutif', tone: 'text-amber-300' },
          ].map(({ icon: Icon, label, tone }, index) => <div key={label} className={`flex items-center justify-center gap-3 sm:gap-4 ${index % 2 === 0 ? 'border-r border-white/20 sm:border-r' : 'sm:border-r'} ${index === 3 ? 'sm:border-r-0' : ''}`}>
            <Icon className={`h-8 w-8 ${tone} sm:h-9 sm:w-9`} /><span className="text-sm font-bold sm:text-base lg:text-lg">{label}</span>
          </div>)}
        </div>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-2 bg-[#003f3c] px-5 pb-5 text-xs text-teal-100/70 sm:px-10">
        <span>© 2026 MULANGO Healthcare</span><span>Gestion pharmaceutique</span>
      </footer>
    </main>
  );
}
