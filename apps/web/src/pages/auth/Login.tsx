import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StartupScreen } from '../../components/StartupScreen';

const loginSchema = z.object({
  email: z.string().email('Saisissez une adresse email valide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(' · ') : typeof message === 'string' ? message : 'Connexion impossible. Vérifiez vos identifiants et réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <StartupScreen message="Vérification de votre session…" indeterminate />;
  }

  return (
    <main className="min-h-[100dvh] bg-white lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <aside className="relative isolate min-h-[285px] overflow-hidden bg-gradient-to-br from-[#003c39] via-[#004d48] to-[#00645b] px-5 py-5 text-white sm:min-h-[320px] sm:px-9 sm:py-7 lg:min-h-[100dvh] lg:px-11 lg:py-9 xl:px-14">
        <div className="pointer-events-none absolute inset-0 z-0">
          <img src="/images/landing/pharmacy-team.png" alt="" aria-hidden="true" className="h-full w-full object-cover object-[27%_center] sm:object-[38%_center] lg:object-[50%_center]" />
          <span className="absolute inset-0 bg-gradient-to-r from-[#003c39]/75 via-[#004d48]/50 to-[#004d48]/25 lg:from-[#003c39]/72 lg:via-[#004d48]/40 lg:to-[#004d48]/15" />
          <span className="absolute inset-0 bg-gradient-to-t from-[#003c39]/55 via-transparent to-[#003c39]/20" />
        </div>

        <div className="relative z-10 flex min-h-[245px] flex-col justify-between sm:min-h-[270px] lg:min-h-[calc(100dvh-72px)]">
          <Link to="/" className="inline-flex w-fit items-center gap-2.5" aria-label="MULANGO Healthcare, accueil">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg shadow-black/15 sm:h-12 sm:w-12 lg:h-14 lg:w-14">
              <img src="/icons/pharmacy-emblem.svg" alt="" className="h-10 w-10 object-contain sm:h-11 sm:w-11 lg:h-[52px] lg:w-[52px]" />
            </span>
            <span className="text-base font-extrabold tracking-tight sm:text-lg">MULANGO <span className="font-medium text-teal-100">Healthcare</span></span>
          </Link>

          <div className="relative max-w-[560px] py-5 lg:py-12">
            <p className="hidden text-xs font-semibold uppercase tracking-[.2em] text-teal-200 sm:block">Espace professionnel</p>
            <h1 className="max-w-[70%] text-[1.65rem] font-extrabold leading-[1.08] tracking-tight sm:mt-3 sm:max-w-[48%] sm:text-4xl lg:max-w-[46%] lg:text-[2.55rem] xl:max-w-[52%] xl:text-[3.15rem]">La gestion quotidienne, simplifiée.</h1>
            <p className="mt-3 hidden max-w-[390px] text-sm leading-6 text-teal-50/85 sm:block lg:mt-5 lg:text-base">Consultez les stocks et suivez vos ventes et achats dans un même espace.</p>
            <div className="mt-5 hidden flex-wrap gap-2 sm:flex lg:mt-8">
              {['Médicaments', 'Ventes', 'Achats', 'Stocks'].map((label) => <span key={label} className="rounded-full border border-white/25 bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-teal-50 backdrop-blur-sm">{label}</span>)}
            </div>
          </div>

          <div className="relative z-10 hidden items-center gap-2 text-xs text-teal-100/80 lg:flex">
            <ShieldCheck className="h-4 w-4" /> Accès sécurisé selon les autorisations de votre compte
          </div>
        </div>
      </aside>

      <section className="flex min-h-[calc(100dvh-285px)] flex-col px-5 pb-3 pt-2 sm:min-h-[calc(100dvh-320px)] sm:px-10 sm:pt-4 lg:min-h-[100dvh] lg:px-12 lg:pt-7 xl:px-20">
        <header className="flex items-center justify-end">
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-teal-900 sm:text-sm">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-6 sm:py-10 lg:py-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-[1.75rem] font-extrabold tracking-tight text-slate-950 sm:text-3xl">Connexion</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-500">Accédez à votre espace de gestion.</p>
            </div>

            {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">Adresse email</label>
                <div className={`flex items-center gap-3 rounded-xl border bg-[#f5f7f8] px-3.5 transition focus-within:border-teal-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-900/5 ${errors.email ? 'border-red-300' : 'border-slate-200'}`}>
                  <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                  <input id="email" type="email" autoComplete="username" inputMode="email" {...register('email')} aria-invalid={!!errors.email} className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 sm:h-[52px]" placeholder="nom@pharmacie.cd" />
                </div>
                {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-800">Mot de passe</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-slate-700 transition hover:text-teal-800 hover:underline sm:text-sm">Mot de passe oublié ?</Link>
                </div>
                <div className={`flex items-center gap-3 rounded-xl border bg-[#f5f7f8] px-3.5 transition focus-within:border-teal-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-900/5 ${errors.password ? 'border-red-300' : 'border-slate-200'}`}>
                  <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" />
                  <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" {...register('password')} aria-invalid={!!errors.password} className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 sm:h-[52px]" placeholder="Saisissez votre mot de passe" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={isLoading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-800 to-teal-700 px-4 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:-translate-y-0.5 hover:from-teal-900 hover:to-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:h-[52px]">
                {isLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Vérification en cours…</> : <>Se connecter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-500 sm:mt-8 sm:text-sm">
              Première utilisation ? <Link to="/setup" className="font-bold text-teal-800 hover:text-teal-950 hover:underline">Initialiser le système</Link>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-100 py-3 text-[10px] text-slate-400 sm:py-4 sm:text-xs">
          <span>© 2026 MULANGO Healthcare</span><span>Gestion pharmaceutique</span>
        </footer>
      </section>
    </main>
  );
}
