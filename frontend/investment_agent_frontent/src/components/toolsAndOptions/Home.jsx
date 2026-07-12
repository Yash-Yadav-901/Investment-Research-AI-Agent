import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaLightbulb, 
  FaTools, 
  FaFolderOpen, 
  FaChartBar, 
  FaComments, 
  FaBolt, 
  FaReact, 
  FaRobot, 
  FaDatabase, 
  FaGithub, 
  FaLinkedin,
  FaArrowRight 
} from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFFBEB] text-[#0F172A] p-6 md:p-12 font-sans selection:bg-[#FCD34D] selection:text-[#0F172A]">
      {/* Hero Banner Section */}
      <div className="relative bg-[#FCD34D] border-4 border-[#0F172A] p-8 md:p-12 rounded-3xl shadow-[8px_8px_0px_0px_#0F172A] mb-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center gap-1.5 bg-[#22C55E] text-[#0F172A] text-xs font-black uppercase tracking-widest px-3 py-1.5 border-2 border-[#0F172A] rounded-full shadow-[2px_2px_0px_0px_#0F172A]">
            <FaRobot /> Active AI Agent
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none text-[#0F172A]">
            Investment Research <br />
            <span className="bg-[#3B82F6] text-white px-2 py-1 inline-block my-2 border-4 border-[#0F172A] rounded-xl shadow-[4px_4px_0px_0px_#0F172A]">
              AI Agent
            </span>
          </h1>
          <p className="text-md md:text-lg font-bold text-[#334155] max-w-xl">
            A state of the art financial intelligence dashboard designed to streamline company analysis, document parsing, and financial modeling with natural language prompts.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => navigate("/workspaces")}
              className="flex items-center gap-2 bg-[#22C55E] hover:bg-[#1f9d4c] text-[#0F172A] font-black text-sm uppercase px-6 py-3.5 border-4 border-[#0F172A] rounded-xl shadow-[4px_4px_0px_0px_#0F172A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0F172A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
            >
              Get Started <FaArrowRight />
            </button>
            <a
              href="#features"
              className="bg-white hover:bg-slate-100 text-[#0F172A] font-black text-sm uppercase px-6 py-3.5 border-4 border-[#0F172A] rounded-xl shadow-[4px_4px_0px_0px_#0F172A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0F172A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all inline-block text-center"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Decorative Graphic Widget */}
        <div className="w-full md:w-80 flex justify-center items-center">
          <div className="relative bg-white border-4 border-[#0F172A] p-6 rounded-2xl shadow-[6px_6px_0px_0px_#0F172A] w-64 rotate-2 hover:rotate-0 transition-transform duration-200">
            {/* Window header */}
            <div className="flex items-center gap-2 border-b-4 border-[#0F172A] pb-3 mb-4">
              <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] border-2 border-[#0F172A]"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#FCD34D] border-2 border-[#0F172A]"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#22C55E] border-2 border-[#0F172A]"></span>
              <span className="text-[10px] font-black uppercase ml-auto text-slate-500">financial.dax</span>
            </div>
            {/* Widget layout */}
            <div className="space-y-3">
              <div className="bg-[#EF4444]/10 p-2 rounded-lg border-2 border-dashed border-[#EF4444]/60 text-center flex items-center justify-center gap-2">
                <FaBolt className="text-[#EF4444]" />
                <span className="text-[11px] font-black uppercase text-[#EF4444]">Redis Caching Active</span>
              </div>
              <div className="bg-[#3B82F6]/10 p-2 rounded-lg border-2 border-dashed border-[#3B82F6]/60 text-center flex items-center justify-center gap-2">
                <FaRobot className="text-[#3B82F6]" />
                <span className="text-[11px] font-black uppercase text-[#3B82F6]">Groq LLM Connected</span>
              </div>
              <div className="bg-[#22C55E]/10 p-2 rounded-lg border-2 border-dashed border-[#22C55E]/60 text-center flex items-center justify-center gap-2">
                <FaDatabase className="text-[#22C55E]" />
                <span className="text-[11px] font-black uppercase text-[#22C55E]">Neon Postgres Sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white border-4 border-[#0F172A] p-6 md:p-8 rounded-2xl shadow-[6px_6px_0px_0px_#0F172A]">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider mb-4 border-b-4 border-[#0F172A] pb-2 flex items-center gap-2">
            <FaLightbulb className="text-[#FCD34D] stroke-2" /> What is this Project?
          </h2>
          <div className="font-bold text-slate-700 leading-relaxed space-y-4">
            <p>
              The <strong className="text-[#0F172A]">Investment Research AI Agent</strong> is an interactive web-based toolkit built for modern financial analysis. It leverages large language models (LLMs) to automatically ingest and parse company financials, construct intelligence dashboards, and present complex metrics inside high-fidelity modular Workspaces.
            </p>
            <p>
              Unlike typical analytical software, our system is designed to be highly conversational. With Groq integration on the frontend, users can talk directly to their research agents, query balance sheets, calculate custom metrics, and request summary breakdowns instantly without round-trip data latency.
            </p>
          </div>
        </div>

        {/* Tech Stack Box */}
        <div className="bg-[#3B82F6] border-4 border-[#0F172A] p-6 rounded-2xl shadow-[6px_6px_0px_0px_#0F172A] text-white">
          <h2 className="text-xl font-black uppercase tracking-wider mb-4 border-b-4 border-white pb-2 flex items-center gap-2">
            <FaTools className="text-[#FCD34D]" /> Tech Stack Architecture
          </h2>
          <ul className="space-y-3 font-bold text-sm">
            <li className="flex items-center gap-2 bg-white/10 p-2 rounded-lg border border-white/20">
              <span className="text-[#FCD34D] text-lg"><FaReact /></span>
              <div>
                <p className="font-black uppercase text-xs text-[#FCD34D]">React 19 & Tailwind CSS</p>
                <p className="text-[11px] text-slate-100">Highly customized Neo-brutal layout design</p>
              </div>
            </li>
            <li className="flex items-center gap-2 bg-white/10 p-2 rounded-lg border border-white/20">
              <span className="text-[#FCD34D] text-lg"><FaRobot /></span>
              <div>
                <p className="font-black uppercase text-xs text-[#FCD34D]">Groq & Gemini APIs</p>
                <p className="text-[11px] text-slate-100">Stateless chatbot & financial model processing</p>
              </div>
            </li>
            <li className="flex items-center gap-2 bg-white/10 p-2 rounded-lg border border-white/20">
              <span className="text-[#FCD34D] text-lg"><FaBolt /></span>
              <div>
                <p className="font-black uppercase text-xs text-[#FCD34D]">Redis Caching Layer</p>
                <p className="text-[11px] text-slate-100">API speed optimization & prompt caching</p>
              </div>
            </li>
            <li className="flex items-center gap-2 bg-white/10 p-2 rounded-lg border border-white/20">
              <span className="text-[#FCD34D] text-lg"><FaDatabase /></span>
              <div>
                <p className="font-black uppercase text-xs text-[#FCD34D]">Neon DB PostgreSQL</p>
                <p className="text-[11px] text-slate-100">Prisma client migrations with Neon Postgres</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="mb-12">
        <h2 className="text-2xl font-black uppercase tracking-wider mb-8 text-center text-[#0F172A]">
          Key Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-[#FCD34D] border-4 border-[#0F172A] p-6 rounded-2xl shadow-[5px_5px_0px_0px_#0F172A] flex flex-col justify-between">
            <div>
              <div className="text-[#0F172A] text-3xl mb-3"><FaFolderOpen /></div>
              <h3 className="text-md font-black uppercase mb-2">Modular Workspaces</h3>
              <p className="text-xs font-bold text-slate-700">
                Segment your research projects into discrete workspace folders to maintain isolated contexts for different sectors or client portfolios.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#FF9F1C] border-4 border-[#0F172A] p-6 rounded-2xl shadow-[5px_5px_0px_0px_#0F172A] flex flex-col justify-between">
            <div>
              <div className="text-[#0F172A] text-3xl mb-3"><FaChartBar /></div>
              <h3 className="text-md font-black uppercase mb-2">Dynamic Charts</h3>
              <p className="text-xs font-bold text-slate-700">
                Visualize financial health trends, growth indicators, balance sheets, and key performance ratios inside interactive widgets.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#22C55E] border-4 border-[#0F172A] p-6 rounded-2xl shadow-[5px_5px_0px_0px_#0F172A] flex flex-col justify-between">
            <div>
              <div className="text-[#0F172A] text-3xl mb-3"><FaComments /></div>
              <h3 className="text-md font-black uppercase mb-2">Groq Chat Interface</h3>
              <p className="text-xs font-bold text-slate-700">
                Chat side-by-side with your data. The integrated Groq model provides instant, stateless calculations and breakdown responses.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-[#3B82F6] border-4 border-[#0F172A] p-6 rounded-2xl shadow-[5px_5px_0px_0px_#0F172A] text-white flex flex-col justify-between">
            <div>
              <div className="text-white text-3xl mb-3"><FaBolt /></div>
              <h3 className="text-md font-black uppercase mb-2">Optimized APIs</h3>
              <p className="text-xs font-bold text-slate-100">
                Experience ultra-low latency dashboards, powered by Redis backend query caching and automated schema migrations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Steps to Use */}
      <div className="bg-white border-4 border-[#0F172A] p-8 rounded-2xl shadow-[6px_6px_0px_0px_#0F172A] mb-12">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider mb-6 border-b-4 border-[#0F172A] pb-2 text-[#0F172A] flex items-center gap-2">
          <FaTools className="text-[#3B82F6]" /> How To Use the Platform
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative pl-12">
            <div className="absolute top-0 left-0 bg-[#3B82F6] text-white border-2 border-black w-8 h-8 rounded-lg flex items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              1
            </div>
            <h3 className="font-black uppercase text-sm mb-2">Create Workspace</h3>
            <p className="text-xs font-bold text-slate-600">
              Navigate to the <span className="underline decoration-wavy decoration-[#FCD34D]">Workspaces</span> tab, click the folder badge, and give your new module a unique name.
            </p>
          </div>

          <div className="relative pl-12">
            <div className="absolute top-0 left-0 bg-[#FCD34D] text-black border-2 border-black w-8 h-8 rounded-lg flex items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              2
            </div>
            <h3 className="font-black uppercase text-sm mb-2">Enter Tickers</h3>
            <p className="text-xs font-bold text-slate-600">
              Open your workspace and initialize analysis by inputting a valid public ticker or sector keyword in the central query container.
            </p>
          </div>

          <div className="relative pl-12">
            <div className="absolute top-0 left-0 bg-[#22C55E] text-black border-2 border-black w-8 h-8 rounded-lg flex items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              3
            </div>
            <h3 className="font-black uppercase text-sm mb-2">Interact and Report</h3>
            <p className="text-xs font-bold text-slate-600">
              Engage with generated financial metrics, inspect key tables, and query the sidebar chatbot to summarize risk factors or write investment reports.
            </p>
          </div>
        </div>
      </div>

      {/* Developer Card (Yash Yadav) */}
      <div className="max-w-2xl mx-auto bg-white border-4 border-[#0F172A] p-6 md:p-8 rounded-3xl shadow-[8px_8px_0px_0px_#0F172A]">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar representation using SVG & Neo-brutalist circle wrapper */}
          <div className="w-24 h-24 rounded-full bg-[#FFCC4D] border-4 border-[#0F172A] shadow-[4px_4px_0px_0px_#0F172A] flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-16 h-16">
              <circle cx="50" cy="40" r="22" fill="#3B82F6" stroke="#0f172a" strokeWidth="4" />
              <path d="M20 90 C 20 60, 80 60, 80 90" fill="#22C55E" stroke="#0f172a" strokeWidth="4" />
              <circle cx="43" cy="38" r="3" fill="#0f172a" />
              <circle cx="57" cy="38" r="3" fill="#0f172a" />
              <path d="M42 50 Q50 56 58 50" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3">
            <span className="bg-[#3B82F6] text-white text-[10px] font-black uppercase px-2.5 py-1 border-2 border-[#0F172A] rounded shadow-[1.5px_1.5px_0px_0px_#0F172A] inline-block">
              Creator & Developer
            </span>
            <h2 className="text-2xl font-black uppercase text-[#0F172A] tracking-wide">Yash Yadav</h2>
            <p className="text-xs font-bold text-slate-600">
              Hi, I'm Yash Yadav, a Computer Science and Engineering student with hands-on experience in full-stack development, backend engineering, cloud computing, and DevOps, Gen AI. I enjoy building scalable software, solving real-world problems, and continuously improving my skills through challenging projects and data structures & algorithms.

            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-2">
              <a
                href="https://github.com/Yash-Yadav-901"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white font-black text-xs uppercase px-4 py-2 border-2 border-[#0F172A] rounded-lg shadow-[2.5px_2.5px_0px_0px_#22C55E] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-none active:translate-x-[2.5px] active:translate-y-[2.5px] transition-all"
              >
                <FaGithub /> GitHub Profile
              </a>
              <a
                href="https://www.linkedin.com/in/yashyadav90/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-xs uppercase px-4 py-2 border-2 border-[#0F172A] rounded-lg shadow-[2.5px_2.5px_0px_0px_#FCD34D] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-none active:translate-x-[2.5px] active:translate-y-[2.5px] transition-all"
              >
                <FaLinkedin /> LinkedIn Profile
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
