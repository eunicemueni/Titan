
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const BootScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [status, setStatus] = useState('INITIALIZING_OS_CORE');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sequence = [
      { s: 'LOADING_IDENTITY_VAULT', p: 20 },
      { s: 'SYNCHRONIZING_NEURAL_DNA', p: 45 },
      { s: 'ESTABLISHING_BRIDGE_UPLINK', p: 70 },
      { s: 'SYSTEM_READY', p: 100 }
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        setStatus(sequence[i].s);
        setProgress(sequence[i].p);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#02040a', 
      color: '#6366f1', 
      fontFamily: 'JetBrains Mono, monospace' 
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ fontSize: '32px', fontWeight: 900, fontStyle: 'italic', color: '#fff', letterSpacing: '-1px' }}>TITAN OS</div>
        <div style={{ width: '200px', h: '2px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#6366f1', transition: 'width 0.3s ease' }}></div>
        </div>
        <div style={{ fontSize: '10px', color: '#4b5563', letterSpacing: '4px', fontWeight: 700 }}>{status}</div>
      </div>
    </div>
  );
};

const Root = () => {
  const [booted, setBooted] = useState(false);

  if (!booted) return <BootScreen onComplete={() => setBooted(true)} />;
  return <App />;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}
