import React from "react";
import SideBar from "./SideBar";
import ContentList from "./ContentLits";

const CombineTools = () => {
  return (
   <div className="flex">
    <SideBar/>
    <div className="flex-1 p-4">
      <ContentList/>
    </div>
   </div>
  );
}

export default CombineTools;