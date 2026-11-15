
import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden print:hidden"
        />
      )}

      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />
      </div>

      {/* Main Content */}
      <div className="min-h-screen min-w-0 lg:ml-64 print:ml-0 print:min-h-0">

        {/* Header */}
        <div className="print:hidden">
          <Header onMenuClick={openSidebar} />
        </div>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8 print:p-0">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default MainLayout;
