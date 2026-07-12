import React, { useState } from "react";
import SideBar from "./SideBar";
import TopNavBar from "./TopNavBar";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-950">
      {/* Sidebar - responsive overlay on mobile, fixed on desktop */}
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main page content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavBar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-auto bg-zinc-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
