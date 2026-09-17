import React from 'react';
import { StudioLogo } from './StudioLogo';
import { db } from '../services/db';
import {
  Home,
  Package,
  Sparkles,
  Tag,
  Building2,
  User as UserIcon,
  Users,
  FolderArchive,
  AlertCircle,
  BarChart3,
  PlusCircle,
  Settings,
  Trash2,
  X,
  Smartphone,
  Layers,
  ShoppingBag,
  History,
  FileCode2,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  onNavigate,
}) => {
  const pendingCount = db.getPrescriptions().filter((p) => p.status === 'DA_VERIFICARE').length +
    db.getClients().filter((c) => !c.isComplete).length;
  const showcaseCount = db.getEyeglasses().filter((e) => e.isShowcase).length;
  const promoCount = db.getEyeglasses().filter((e) => e.isPromo).length;
  const trashCount = db.getEyeglasses(true).filter((e) => e.deletedAt !== null).length +
    db.getClients(true).filter((c) => c.deletedAt !== null).length;

  const handleItemClick = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const navItems = [
    { id: 'home', label: 'Home / Cerca con IA', icon: Home },
    { id: 'inventory', label: 'Inventario Disponibili', icon: Package },
    { id: 'showcase', label: 'Vetrina', icon: Sparkles, badge: showcaseCount > 0 ? showcaseCount : undefined, badgeColor: 'bg-amber-500/20 text-amber-300' },
    { id: 'promotions', label: 'Promo', icon: Tag, badge: promoCount > 0 ? promoCount : undefined, badgeColor: 'bg-rose-500/20 text-rose-300' },
    { id: 'brands', label: 'Brand / Marchi', icon: Building2 },
    { id: 'gender-uomo', label: 'Uomo', icon: UserIcon },
    { id: 'gender-donna', label: 'Donna', icon: UserIcon },
    { id: 'gender-unisex', label: 'Unisex', icon: Layers },
    { id: 'sales-history', label: 'Venduti', icon: History },
    { id: 'clients', label: 'Clienti', icon: Users },
    { id: 'prescriptions', label: 'Archivio Prescrizioni & Gradazioni', icon: FolderArchive },
    { id: 'pending', label: 'Da verificare', icon: AlertCircle, badge: pendingCount > 0 ? pendingCount : undefined, badgeColor: 'bg-orange-500 text-white animate-pulse' },
    { id: 'statistics', label: 'Statistiche e Totali', icon: BarChart3 },
    { id: 'add-product', label: 'Aggiungi nuovo occhiale', icon: PlusCircle, highlight: true },
    { id: 'flutter-export', label: 'Progetto Flutter / APK & Termux', icon: FileCode2, highlightTech: true },
    { id: 'settings', label: 'Impostazioni', icon: Settings },
    { id: 'trash', label: 'Cestino', icon: Trash2, badge: trashCount > 0 ? trashCount : undefined, badgeColor: 'bg-slate-700 text-slate-300' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        id="sidebar-drawer"
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-teal-950 border-r border-teal-800/60 z-50 flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-teal-800/60 flex items-center justify-between bg-teal-900/40">
          <StudioLogo size="md" />
          <button
            id="btn-close-sidebar"
            onClick={onClose}
            className="p-2 text-teal-300 hover:text-white hover:bg-teal-800/60 rounded-lg transition-colors"
            title="Chiudi Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Banner */}
        <div className="p-3 bg-teal-900/20 border-b border-teal-800/40">
          <button
            onClick={() => handleItemClick('fast-sale')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>🛒 Nuova Vendita Rapida</span>
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md font-semibold'
                    : item.highlight
                    ? 'bg-teal-900/40 text-teal-200 hover:bg-teal-800/50 hover:text-white border border-teal-700/40'
                    : item.highlightTech
                    ? 'bg-indigo-950/40 text-indigo-200 hover:bg-indigo-900/50 hover:text-white border border-indigo-800/40'
                    : 'text-slate-300 hover:bg-teal-900/30 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-teal-400'
                        : item.highlightTech
                        ? 'text-indigo-400'
                        : 'text-teal-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer: Software info & device sync */}
        <div className="p-3 border-t border-teal-900/80 bg-slate-950/60 text-[11px] text-teal-300/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>2 Terminali Sincronizzati</span>
          </div>
          <span className="text-[10px] font-mono text-teal-400">v1.0.0</span>
        </div>
      </aside>
    </>
  );
};
