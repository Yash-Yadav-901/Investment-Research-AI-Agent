import React from 'react';
import { SignUp } from '@clerk/react';

const SignUpPage = () => {
    return (
        <div className="min-h-screen bg-[#FFFBEB] flex items-center justify-center p-4 selection:bg-[#FDE047]">
            <div className="relative p-2 bg-white border-4 border-[#0F172A] rounded-2xl shadow-[8px_8px_0px_0px_#0F172A] max-w-sm w-full overflow-hidden flex flex-col items-center">
                <div className="w-full bg-[#FCD34D] border-b-4 border-[#0F172A] px-6 py-4 flex items-center gap-3">
                    <div className="relative w-8 h-7 bg-[#FBBF24] border-2 border-[#0F172A] rounded-md shadow-[1.5px_1.5px_0px_0px_#0F172A] flex items-center justify-center overflow-visible flex-shrink-0">
                        <div className="absolute -top-[4px] left-1 w-3.5 h-1.5 bg-[#D97706] border-b-2 border-[#0F172A] rounded-t-sm"></div>
                    </div>
                    <span className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
                        Create Terminal Account
                    </span>
                </div>

                <div className="p-6 w-full flex justify-center bg-white">
                    <SignUp
                        fallbackRedirectUrl="/home"
                        signInUrl="/sign-in"
                        appearance={{
                            elements: {
                                rootBox: "w-full mx-auto font-sans",
                                cardBox: "shadow-none border-0 p-0 bg-transparent w-full",
                                card: "shadow-none border-0 p-0 bg-transparent w-full",
                                headerTitle: "text-lg font-black text-[#0F172A] uppercase tracking-tight text-left",
                                headerSubtitle: "text-xs font-bold text-slate-500 text-left",
                                socialButtonsBlockButton: "border-2 border-[#0F172A] bg-white rounded-xl shadow-[2.5px_2.5px_0px_0px_#0F172A] transition-all hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#0F172A] active:translate-y-0 active:shadow-none font-bold text-xs text-[#0F172A]",
                                formButtonPrimary: "bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-xs uppercase tracking-wider border-2 border-[#0F172A] rounded-xl shadow-[3px_3px_0px_0px_#0F172A] hover:-translate-y-[2px] active:translate-y-0 active:shadow-none transition-all py-2.5",
                                formFieldLabel: "text-xs font-black text-[#0F172A] uppercase tracking-wide",
                                formFieldInput: "bg-white border-2 border-[#0F172A] rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:bg-[#FFFBEB] transition-colors focus:ring-0 shadow-none h-9 px-3",
                                footerActionLink: "text-[#3B82F6] hover:underline font-black text-xs",
                                footerActionText: "text-xs font-bold text-slate-500",
                                dividerRow: "hidden",
                                dividerLine: "bg-[#0F172A]/10 h-[2px]",
                                dividerText: "text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white px-2"
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;