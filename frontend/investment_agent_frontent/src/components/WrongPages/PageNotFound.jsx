import React from 'react';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-4 selection:bg-[#FDE047]">
      <div className="bg-white border-4 border-[#0F172A] rounded-2xl p-8 max-w-md w-full text-center shadow-[6px_6px_0px_0px_#0F172A] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-[#EF4444]"></div>
        
        <div className="relative inline-flex items-center justify-center w-24 h-20 bg-[#FCD34D] border-4 border-[#0F172A] rounded-2xl shadow-[4px_4px_0px_0px_#0F172A] mb-6 overflow-visible">
          <div className="absolute -top-[7px] left-2 w-8 h-3 bg-[#D97706] border-b-4 border-[#0F172A] rounded-t-md"></div>
          <span className="text-3xl font-black text-[#0F172A] tracking-tighter">?</span>
          <div className="absolute -bottom-2 -right-2 bg-[#EF4444] text-white font-black text-xs px-2 py-0.5 border-2 border-[#0F172A] rounded-md shadow-[1px_1px_0px_0px_#0F172A]">
            404
          </div>
        </div>

        <h1 className="text-2xl font-black text-[#0F172A] uppercase tracking-wide mb-2">
          Page Not Found
        </h1>
        
        <p className="text-slate-600 text-sm font-bold mb-6 leading-relaxed">
          The workspace or terminal page you are looking for does not exist or has been moved.
        </p>

        <button
          onClick={() => navigate('/home')}
          className="w-full py-3 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black rounded-xl border-2 border-[#0F172A] transition-all shadow-[4px_4px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default PageNotFound;