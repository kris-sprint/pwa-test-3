import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

function App() {
  const [count, setCount] = useState<number>(0);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isIOSChrome, setIsIOSChrome] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||  // iOS Safari
        window.location.href.includes('homescreen=1'); // Extra check for some browsers
        
      setIsStandalone(isStandaloneMode);
    };

    // Initial check
    checkStandalone();

    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    
    mediaQuery.addListener(handleChange);

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isIOSChromeDevice = /CriOS/.test(navigator.userAgent);
    
    setIsIOS(isIOSDevice);
    setIsIOSChrome(isIOSChromeDevice);

    // Only add beforeinstallprompt listener if not on iOS
    if (!isIOSDevice) {
      const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      const handleAppInstalled = () => {
        setDeferredPrompt(null);
        setIsInstallable(false);
        setIsStandalone(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        mediaQuery.removeListener(handleChange);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleInstallClick = async (): Promise<void> => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Error during installation:', err);
    }
  };

  const renderInstallButton = () => {
    // Don't show any install options if already in standalone mode
    if (isStandalone) {
      return null;
    }

    if (isIOSChrome) {
      return (
        <div className="ios-instructions">
          <p>To install this app on iOS Chrome:</p>
          <ol>
            <li>Open this page in Safari</li>
            <li>Follow the Safari instructions below</li>
          </ol>
        </div>
      );
    } else if (isIOS) {
      return (
        <div className="ios-instructions">
          <p>To install this app on your iPhone:</p>
          <ol>
            <li>Tap the Share button in Safari <span className="ios-icon">􀈂</span></li>
            <li>Scroll down and tap "Add to Home Screen" <span className="ios-icon">􀏦</span></li>
            <li>Tap "Add" in the top right</li>
          </ol>
        </div>
      );
    } else if (isInstallable) {
      return (
        <button 
          onClick={handleInstallClick}
          className="install-button"
        >
          Install App
        </button>
      );
    }
    return null;
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        {renderInstallButton()}
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;