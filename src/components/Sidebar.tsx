import React from 'react';
import { useApp, ViewType } from '../context/AppContext';
import {
  RocketPipelineIcon,
  KanbanJiraIcon,
  ChronoWorklogIcon,
  ChainIntegrationsIcon,
  GearProfilesIcon
} from './icons/NavigationIcons';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const { activeProfile, jiraIssues, projectScan } = useApp();

  const renderNavIcon = (id: ViewType, isActive: boolean) => {
    switch (id) {
      case 'pipeline':
        return <RocketPipelineIcon size={24} isActive={isActive} />;
      case 'jira':
        return <KanbanJiraIcon size={24} isActive={isActive} />;
      case 'worklogs':
        return <ChronoWorklogIcon size={24} isActive={isActive} />;
      case 'integrations':
        return <ChainIntegrationsIcon size={24} isActive={isActive} />;
      case 'profiles':
        return <GearProfilesIcon size={24} isActive={isActive} />;
    }
  };

  const navItems = [
    {
      id: 'pipeline' as ViewType,
      label: 'Pipeline & .BAT',
      sublabel: 'Flujo completo y scripts por lotes'
    },
    {
      id: 'jira' as ViewType,
      label: 'Tablero & Tareas Jira',
      sublabel: `${jiraIssues.length} tarjetas detectadas`
    },
    {
      id: 'worklogs' as ViewType,
      label: 'Bitácora & Horas',
      sublabel: 'Imputación semanal CMMI v3.0'
    },
    {
      id: 'integrations' as ViewType,
      label: 'Bitbucket & Confluence',
      sublabel: 'Control Git, ramas y release'
    },
    {
      id: 'profiles' as ViewType,
      label: 'Perfiles de Proyecto',
      sublabel: 'Rutas y tokens Atlassian'
    }
  ];

  return (
    <aside className="w-64 glass-panel border-r border-black/5 dark:border-white/10 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-1.5">
        <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
          Navegación del Proyecto
        </div>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-start space-x-3 ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-950/50 text-gray-900 dark:text-gray-100 border border-brand-500/30 dark:border-brand-500/40 shadow-xs font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border border-transparent'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {renderNavIcon(item.id, isActive)}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-semibold truncate leading-tight ${isActive ? 'text-brand-700 dark:text-brand-300 font-bold' : 'text-gray-900 dark:text-gray-100'}`}>
                  {item.label}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {item.sublabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Details */}
      <div className="p-4 border-t border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 space-y-1.5 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">Proyecto Base:</span>
          {projectScan?.bats && (
            <span className="text-[9px] bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-800 font-mono font-semibold">
              {projectScan.bats.length} .bat
            </span>
          )}
        </div>
        <div className="text-xs text-gray-900 dark:text-gray-100 font-bold truncate">
          {activeProfile?.name || 'Sin perfil activo'}
        </div>
        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-mono">
          {activeProfile?.projectPath || 'Ruta no configurada'}
        </div>
      </div>
    </aside>
  );
};