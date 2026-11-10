import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PipelineView } from './components/PipelineView';
import { JiraView } from './components/JiraView';
import { WorklogView } from './components/WorklogView';
import { IntegrationsView } from './components/IntegrationsView';
import { ProfilesView } from './components/ProfilesView';
import { WaveDialBackground } from './components/WaveDialBackground';

export const App: React.FC = () => {
  const { currentView, setCurrentView, theme } = useApp();

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-[#F7F7F4] dark:bg-[#080808] text-[#16181D] dark:text-[#DEDEDE] font-sans select-none transition-colors duration-300">
      {/* Fondo Escultórico de Olas en Relieve (Inspirado en Relojes Análogos) */}
      <WaveDialBackground isDark={theme === 'dark'} />

      {/* Capa de Interfaz y Controles de Gobernanza */}
      <div className="relative z-10 flex flex-col h-full w-full">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar currentView={currentView} onSelectView={setCurrentView} />
          <main className="flex-1 flex overflow-hidden">
            {currentView === 'pipeline' && <PipelineView />}
            {currentView === 'jira' && <JiraView />}
            {currentView === 'worklogs' && <WorklogView />}
            {currentView === 'integrations' && <IntegrationsView />}
            {currentView === 'profiles' && <ProfilesView />}
          </main>
        </div>
      </div>
    </div>
  );
};