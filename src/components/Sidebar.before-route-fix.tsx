import React, { useState } from 'react';
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
  ChevronDown,
  UserCheck,
  RefreshCw,
  WifiOff,
  Store,
  UserPlus,
  ReceiptText,
  SlidersHorizontal,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
}

type MenuGroup = 'occhiali' | 'pazienti' | 'prescrizioni' | 'vendite' | 'attivita' | 'sistema';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeClass?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  onNavigate,
}) => {
  const settings = db.getSettings();
  const users = db.getUsers();
  const currentUser = db.getCurrentUser();
  const syncStatus = db.getSyncStatus();

  const [openGroups, setOpenGroups] = useState<Record<MenuGroup, boolean>>({
    occhiali: true,
    pazienti: true,
    prescrizioni: true,
    vendite: true,
    attivita: false,
    sistema: false,
  });

  const pendingCount =
    db.getPrescriptions().filter((p) => p.status === 'DA_VERIFICARE').length +
    db.getClients().filter((c) => !c.isComplete).length;

  const showcaseCount = db.getEyeglasses().filter((e) => e.isShowcase).length;
  const promoCount = db.getEyeglasses().filter((e) => e.isPromo).length;

  const trashCount =
    db.getEyeglasses(true).filter((e) => e.deletedAt !== null).length +
    db.getClients(true).filter((e) => e.deletedAt !== null).length;

  const soldCount = db.getSales().length;

  const toggleGroup = (group: MenuGroup) => {
    setOpenGroups((current) => ({
      ...current,
      [group]: !current[group],
    }));
  };

  const handleItemClick = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const renderItem = (item: MenuItem, compact = false) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;

    return (
      <button
        key={item.id}
        id={`nav-item-${item.id}`}
        onClick={() => handleItemClick(item.id)}
        className={`group w-full flex items-center justify-between ${
          compact ? 'px-3 py-2' : 'px-3 py-2.5'
        } rounded-xl text-left transition-all duration-200 ${
          isActive
            ? 'bg-[#292725] text-white shadow-sm'
            : 'text-[#5f5a55] hover:bg-[#eee8df] hover:text-[#292725]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className={`w-[17px] h-[17px] flex-shrink-0 ${
              isActive ? 'text-[#f8f5ef]' : 'text-[#8b5360]'
            }`}
          />
          <span className="truncate">{item.label}</span>
        </div>

        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={`ml-2 flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              item.badgeClass || 'bg-[#e8ded3] text-[#6f6258]'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const renderGroup = (
    group: MenuGroup,
    label: string,
    items: MenuItem[],
    visible: boolean,
  ) => {
    if (!visible) return null;

    const isOpenGroup = openGroups[group];
    const containsActive = items.some((item) => item.id === activeView);

    return (
      <div className="mb-2">
        <button
          type="button"
          onClick={() => toggleGroup(group)}
          className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
            containsActive ? 'text-[#8b5360]' : 'text-[#99918a]'
          }`}
        >
          <span>{label}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              isOpenGroup ? 'rotate-0' : '-rotate-90'
            }`}
          />
        </button>

        {isOpenGroup && (
          <div className="space-y-0.5">
            {items.map((item) => renderItem(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#292725]/25 backdrop-blur-[2px] z-50"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="sidebar-drawer"
        className={`fixed top-0 left-0 bottom-0 w-[330px] max-w-[88vw] bg-[#f8f5ef] border-r border-[#ded7ce] z-50 flex flex-col transform transition-transform duration-300 ease-out shadow-[12px_0_40px_rgba(41,39,37,0.10)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5ded5] flex items-center justify-between">
          <StudioLogo size="md" />

          <button
            id="btn-close-sidebar"
            onClick={onClose}
            className="p-2 text-[#7d746c] hover:text-[#292725] hover:bg-[#eee8df] rounded-full transition-colors"
            title="Chiudi Menu"
            aria-label="Chiudi Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User / Device */}
        <div className="px-4 py-3 border-b border-[#e5ded5]">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f1ebe3] border border-[#e4dbd1]">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: currentUser.avatarColor || '#8b5360' }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#292725] truncate">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#7d746c]">
                <Smartphone className="w-3 h-3" />
                <span>Terminale {syncStatus.activeDevice}</span>
                <span>·</span>
                <span>{currentUser.role}</span>
              </div>
            </div>

            <UserCheck className="w-4 h-4 text-[#8b5360]" />
          </div>

          {users.length > 1 && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => db.setCurrentUser(user.id)}
                  className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] transition-colors ${
                    user.id === currentUser.id
                      ? 'bg-[#292725] text-white'
                      : 'bg-white border border-[#e1d9d0] text-[#6f675f] hover:bg-[#eee8df]'
                  }`}
                >
                  {user.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Sale */}
        <div className="px-4 py-3">
          <button
            onClick={() => handleItemClick('fast-sale')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#8b5360] hover:bg-[#784754] text-white font-semibold text-xs shadow-sm transition-all active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4" />
            Nuova vendita rapida
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {renderItem({
            id: 'home',
            label: 'Home / Cerca con IA',
            icon: Home,
          })}

          <div className="my-3 border-t border-[#e8e1d8]" />

          {renderGroup(
            'occhiali',
            'Occhiali',
            [
              { id: 'inventory', label: 'Tutti gli occhiali', icon: Package },
              { id: 'brands', label: 'Marche / Brand', icon: Building2 },
              { id: 'gender-uomo', label: 'Uomo', icon: UserIcon },
              { id: 'gender-donna', label: 'Donna', icon: UserIcon },
              { id: 'gender-unisex', label: 'Unisex', icon: Layers },
              {
                id: 'showcase',
                label: 'Vetrina',
                icon: Sparkles,
                badge: showcaseCount,
                badgeClass: 'bg-[#eee1b9] text-[#76613a]',
              },
              {
                id: 'promotions',
                label: 'Promozioni',
                icon: Tag,
                badge: promoCount,
                badgeClass: 'bg-[#ead8dc] text-[#8b5360]',
              },
              {
                id: 'sales-history',
                label: 'Venduti',
                icon: History,
                badge: soldCount,
                badgeClass: 'bg-[#e4ded7] text-[#625b55]',
              },
            ],
            settings.menuCategories.occhiali,
          )}

          {renderGroup(
            'pazienti',
            'Pazienti',
            [
              { id: 'clients', label: 'Tutti i pazienti', icon: Users },
              { id: 'add-client', label: 'Nuovo paziente', icon: UserPlus },
            ],
            settings.menuCategories.pazienti,
          )}

          {renderGroup(
            'prescrizioni',
            'Prescrizioni',
            [
              {
                id: 'prescriptions',
                label: 'Archivio prescrizioni',
                icon: FolderArchive,
              },
              {
                id: 'pending',
                label: 'Da verificare',
                icon: AlertCircle,
                badge: pendingCount,
                badgeClass: 'bg-[#d79b72] text-white',
              },
            ],
            settings.menuCategories.prescrizioni,
          )}

          {renderGroup(
            'vendite',
            'Vendite',
            [
              {
                id: 'fast-sale',
                label: 'Vendita rapida',
                icon: ReceiptText,
              },
              {
                id: 'sales-history',
                label: 'Storico vendite',
                icon: History,
              },
            ],
            settings.menuCategories.vendite,
          )}

          {renderGroup(
            'attivita',
            'Attività',
            [
              {
                id: 'statistics',
                label: 'Statistiche e totali',
                icon: BarChart3,
              },
              {
                id: 'trash',
                label: 'Cestino',
                icon: Trash2,
                badge: trashCount,
                badgeClass: 'bg-[#e4ded7] text-[#625b55]',
              },
            ],
            settings.menuCategories.attivita,
          )}

          {renderGroup(
            'sistema',
            'Strumenti',
            [
              {
                id: 'add-product',
                label: 'Aggiungi nuovo occhiale',
                icon: PlusCircle,
              },
              {
                id: 'flutter-export',
                label: 'Progetto Flutter / APK & Termux',
                icon: FileCode2,
              },
            ],
            true,
          )}
        </div>

        {/* Bottom Controls */}
        <div className="border-t border-[#e1d9d0] bg-[#f3eee7]">
          <div className="px-4 py-2.5 flex items-center justify-between text-[10px] text-[#7d746c]">
            <div className="flex items-center gap-1.5">
              {syncStatus.state === 'offline' ? (
                <WifiOff className="w-3.5 h-3.5 text-[#a87555]" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-[#8b5360]" />
              )}
              <span>
                {syncStatus.state === 'offline'
                  ? 'Modalità offline'
                  : syncStatus.state === 'syncing'
                  ? 'Sincronizzazione…'
                  : 'Sincronizzato'}
              </span>
            </div>

            <button
              onClick={() =>
                syncStatus.state === 'offline'
                  ? db.toggleOfflineMode()
                  : db.triggerSyncSimulation()
              }
              className="text-[#8b5360] font-semibold hover:underline"
            >
              {syncStatus.state === 'offline' ? 'Online' : 'Sincronizza'}
            </button>
          </div>

          {/* Settings ALWAYS visible */}
          <div className="px-4 pb-4">
            <button
              id="nav-item-settings"
              onClick={() => handleItemClick('settings')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'settings'
                  ? 'bg-[#292725] text-white'
                  : 'bg-white border border-[#ddd5cc] text-[#514b46] hover:bg-[#eee8df]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings
                  className={`w-4 h-4 ${
                    activeView === 'settings'
                      ? 'text-white'
                      : 'text-[#8b5360]'
                  }`}
                />
                <span>Impostazioni</span>
              </div>
              <SlidersHorizontal className="w-3.5 h-3.5 opacity-50" />
            </button>

            <div className="flex items-center justify-between mt-2 px-1 text-[9px] text-[#aaa19a]">
              <span>Studio Ottico Di Pietro</span>
              <span className="font-mono">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
