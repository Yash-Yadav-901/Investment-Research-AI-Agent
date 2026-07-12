import React from "react";
import WorkspaceNavBar from "./WorkspaceNavBar";
import { Outlet } from "react-router-dom";

const WorkspaceLayout = () => {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden ">
      <WorkspaceNavBar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default WorkspaceLayout;
