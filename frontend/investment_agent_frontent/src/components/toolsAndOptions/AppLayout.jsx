import React from "react";
import SideBar from "./SideBar";
import TopNavBar from "./TopNavBar";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden ">
      {/* Left: persistent sidebar */}
      <SideBar />

      {/* Right: navbar on top, page content below */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
