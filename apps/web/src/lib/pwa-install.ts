export interface PwaInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PwaInstallState {
  prompt: PwaInstallPrompt | null;
  installed: boolean;
}

let deferredPrompt: PwaInstallPrompt | null = null;
const listeners = new Set<(state: PwaInstallState) => void>();
let appInstalled = isStandalone();

function isStandalone(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

function notify(): void {
  appInstalled = appInstalled || isStandalone();
  const state = { prompt: deferredPrompt, installed: appInstalled };
  listeners.forEach((listener) => listener(state));
}

window.addEventListener('beforeinstallprompt', (event: Event) => {
  event.preventDefault();
  deferredPrompt = event as PwaInstallPrompt;
  notify();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  appInstalled = true;
  notify();
});

export function subscribeToPwaInstall(listener: (state: PwaInstallState) => void): () => void {
  listeners.add(listener);
  listener({ prompt: deferredPrompt, installed: appInstalled || isStandalone() });
  return () => listeners.delete(listener);
}

export async function promptPwaInstall(): Promise<'accepted' | 'dismissed' | null> {
  if (!deferredPrompt) return null;

  const prompt = deferredPrompt;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  deferredPrompt = null;
  if (outcome === 'accepted') appInstalled = true;
  notify();
  return outcome;
}
