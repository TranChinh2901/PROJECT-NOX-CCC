'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-[#1C1917] border-b border-[#292524] h-16 flex items-center px-8">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-[#292524] text-[#FAFAF9] border border-[#44403C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7366ff] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <button className="relative p-2 text-[#A1A1AA] hover:text-[#FAFAF9] transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#ef4444] rounded-full"></span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#7366ff] flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.fullname ? user.fullname.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[#FAFAF9] font-medium">{user?.fullname || 'Admin'}</p>
              <p className="text-[#A1A1AA] text-sm capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}