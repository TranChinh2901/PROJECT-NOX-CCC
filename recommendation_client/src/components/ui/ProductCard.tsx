import React from 'react';
import { ChevronRight, Laptop, Smartphone, Monitor } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  image: string;
  specs: string[];
}

interface ProductCardProps {
  product: Product;
  index: number;
}

const getProductIcon = (category: string) => {
  const iconClass = "w-12 h-12 text-[#CA8A04]";
  switch (category) {
    case 'Laptops':
      return <Laptop className={iconClass} />;
    case 'Smartphones':
      return <Smartphone className={iconClass} />;
    case 'Desktop PCs':
      return <Monitor className={iconClass} />;
    default:
      return <Laptop className={iconClass} />;
  }
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  return (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-[16px] border border-white/10 transition-all duration-500 ease-out hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] cursor-pointer"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-[#2A2624] to-[#1C1917] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-transparent to-transparent opacity-60" />
        
        <div className="text-center z-10">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#CA8A04]/20 to-[#3B82F6]/20 flex items-center justify-center">
            {getProductIcon(product.category)}
          </div>
          <p className="text-[#A1A1AA] text-sm">{product.name}</p>
        </div>

        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#CA8A04]/20 text-[#CA8A04] text-xs font-medium">
          {product.category}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-heading font-bold text-[#FAFAF9]">{product.name}</h3>
          <span className="text-[#CA8A04] font-bold text-lg">{product.price}</span>
        </div>

        <p className="text-[#A1A1AA] text-sm mb-4 line-clamp-2">{product.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {product.specs.slice(0, 2).map((spec, i) => (
            <span 
              key={i}
              className="px-2 py-1 text-xs rounded bg-white/5 text-[#A1A1AA] border border-white/10"
            >
              {spec}
            </span>
          ))}
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 text-[#FAFAF9] font-medium transition-all duration-300 hover:bg-[#CA8A04] hover:text-white group-hover:gap-3">
          Explore
          <ChevronRight className="w-4 h-4 transition-transform" />
        </button>
      </div>
    </div>
  );
};
