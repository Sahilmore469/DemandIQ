import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SettingsModal from '../components/SettingsModal';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#edf6f5] dark:bg-[#0c1017] p-2 sm:p-5 lg:p-7 relative overflow-x-hidden flex flex-col justify-center transition-colors">
      {/* Background Decorative Curved Lines SVG matching reference image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60 dark:opacity-20 z-0">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100 200 C300 100, 600 450, 1100 250 C1300 170, 1500 350, 1600 400"
            stroke="#b8e4da"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M-50 450 C350 350, 700 700, 1200 500 C1400 420, 1550 600, 1650 650"
            stroke="#c8ece4"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M100 -50 C400 250, 500 50, 900 150 C1300 250, 1400 -50, 1600 50"
            stroke="#d4f2eb"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M-150 750 C250 650, 800 850, 1300 700 C1500 640, 1600 800, 1700 850"
            stroke="#dcf5ef"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Main White/Dark Rounded Container matching CreditGuard AI */}
      <div className="relative z-10 w-full max-w-[1520px] mx-auto rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#141a24] shadow-[0_20px_60px_rgba(20,50,45,0.08)] border border-[#e2eeeb] dark:border-[#1e2633] overflow-hidden flex flex-col lg:flex-row min-h-[92vh]">
        {/* Docked Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Right Main Body */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#141a24]">
          <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

          <main className="flex-1 p-6 sm:p-8 pt-4 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};

export default MainLayout;
