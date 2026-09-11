import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { Eyeglass } from './types';
import { WatermarkBackground } from './components/WatermarkBackground';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { HomeView } from './views/HomeView';
import { InventoryView } from './views/InventoryView';
import { EyeglassDetailModal } from './views/EyeglassDetailModal';
import { FastSaleModal } from './views/FastSaleModal';
import { AddProductModal } from './views/AddProductModal';
import { ShowcaseView } from './views/ShowcaseView';
import { PromotionsView } from './views/PromotionsView';
import { BrandsView } from './views/BrandsView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { ClientsView } from './views/ClientsView';
import { PrescriptionsView } from './views/PrescriptionsView';
import { PendingTasksView } from './views/PendingTasksView';
import { StatisticsView } from './views/StatisticsView';
import { TrashView } from './views/TrashView';
import { SettingsView } from './views/SettingsView';
import { FlutterProjectExportModal } from './views/FlutterProjectExportModal';

export function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [isFlutterExportOpen, setIsFlutterExportOpen] = useState<boolean>(false);

  // Selected entities for modals
  const [selectedEyeglass, setSelectedEyeglass] = useState<Eyeglass | null>(null);
  const [saleTargetEyeglass, setSaleTargetEyeglass] = useState<Eyeglass | null>(null);
  const [targetClientId, setTargetClientId] = useState<string | undefined>(undefined);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string | undefined>(undefined);

  // Re-render listener for database reactive updates
  const [, setDbVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
    return () => unsubscribe();
  }, []);

  const handleNavigate = (view: string, id?: string) => {
    if (view === 'flutter') {
      setIsFlutterExportOpen(true);
      return;
    }
    if (view === 'clients' && id) {
      setTargetClientId(id);
    }
    setCurrentView(view);
  };

  const handleBrandSelect = (brandName: string) => {
    setSelectedBrandFilter(brandName);
    setCurrentView('inventory');
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-700 selection:text-white overflow-x-hidden">
      {/* Requirement 4: Subtle persistent watermark on all screens */}
      <WatermarkBackground opacity={0.035} />

      {/* Global Application Header (Sync badge, search button, user switcher) */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Slide-out Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Main Screen Layout Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8">
        {currentView === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onSelectEyeglass={(item) => setSelectedEyeglass(item)}
            onOpenFastSale={(item) => setSaleTargetEyeglass(item)}
          />
        )}

        {currentView === 'inventory' && (
          <InventoryView
            onSelectEyeglass={(item) => setSelectedEyeglass(item)}
            onOpenFastSale={(item) => setSaleTargetEyeglass(item)}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
          />
        )}

        {currentView === 'showcase' && (
          <ShowcaseView
            onSelectEyeglass={(item) => setSelectedEyeglass(item)}
            onOpenFastSale={(item) => setSaleTargetEyeglass(item)}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'promotions' && (
          <PromotionsView
            onSelectEyeglass={(item) => setSelectedEyeglass(item)}
            onOpenFastSale={(item) => setSaleTargetEyeglass(item)}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'brands' && (
          <BrandsView
            onSelectBrand={handleBrandSelect}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'sales' && <SalesHistoryView />}

        {currentView === 'clients' && (
          <ClientsView
            initialSelectedClientId={targetClientId}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'prescriptions' && <PrescriptionsView />}

        {currentView === 'pending' && (
          <PendingTasksView onNavigate={handleNavigate} />
        )}

        {currentView === 'statistics' && <StatisticsView />}

        {currentView === 'trash' && <TrashView />}

        {currentView === 'settings' && <SettingsView />}
      </main>

      {/* Modals */}
      {/* 1. Universal AI Search Modal (Sections 8-15) */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectEyeglass={(item) => setSelectedEyeglass(item)}
      />

      {/* 2. Detailed Eyeglass Inspector & Editor (Sections 18 & 19) */}
      <EyeglassDetailModal
        eyeglass={selectedEyeglass}
        onClose={() => setSelectedEyeglass(null)}
        onOpenFastSale={(item) => setSaleTargetEyeglass(item)}
      />

      {/* 3. Fast Sale Processing Modal (Section 30) */}
      <FastSaleModal
        eyeglass={saleTargetEyeglass}
        onClose={() => setSaleTargetEyeglass(null)}
        onCompleted={() => setSaleTargetEyeglass(null)}
      />

      {/* 4. Add New Eyeglass with AI Photo Pre-fill (Sections 20, 26, 27) */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAdded={(newItem) => setSelectedEyeglass(newItem)}
      />

      {/* 5. Complete Flutter Project Source & Termux APK Builder Guide (Section 50) */}
      <FlutterProjectExportModal
        isOpen={isFlutterExportOpen}
        onClose={() => setIsFlutterExportOpen(false)}
      />
    </div>
  );
}

export default App;
