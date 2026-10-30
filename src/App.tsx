import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Dashboard from './components/dashboard/Dashboard';
import NotebookEditor from './components/editor/NotebookEditor';
import { useNotebookStore } from './stores/notebookStore';
import { useAuthStore } from './stores/authStore';

type AppView = 'dashboard' | 'editor';

function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const initializeAuth = useAuthStore(s => s.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const { activeNotebook, closeNotebook, openNotebook } = useNotebookStore(
    useShallow(s => ({
      activeNotebook: s.activeNotebook,
      closeNotebook: s.closeNotebook,
      openNotebook: s.openNotebook,
    }))
  );

  const handleOpenNotebook = (id: string) => {
    setView('editor');
  };

  const handleBack = () => {
    closeNotebook();
    setView('dashboard');
  };

  // If we're in editor view but no active notebook, go back
  useEffect(() => {
    if (view === 'editor' && !activeNotebook) {
      setView('dashboard');
    }
  }, [view, activeNotebook]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {view === 'dashboard' ? (
        <div className="flex-1 overflow-y-auto">
          <Dashboard onOpenNotebook={handleOpenNotebook} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <NotebookEditor onBack={handleBack} />
        </div>
      )}
    </div>
  );
}

export default App;
