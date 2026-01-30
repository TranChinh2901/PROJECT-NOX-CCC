import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ValueBlockProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const ValueBlock: React.FC<ValueBlockProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="group p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 transition-all duration-500 ease-out hover:border-[#CA8A04]/30 hover:bg-white/10">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#CA8A04]/20 to-[#CA8A04]/5 flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110">
        <Icon className="w-7 h-7 text-[#CA8A04]" />
      </div>
      
      <h3 className="text-xl font-heading font-bold text-[#FAFAF9] mb-3">
        {title}
      </h3>
      
      <p className="text-[#A1A1AA] text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};
