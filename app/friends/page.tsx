"use client";

import React, { useState, useMemo } from "react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import { 
  Users, 
  Search, 
  UserPlus, 
  MessageCircle, 
  MoreVertical, 
  Trophy, 
  Zap,
  Filter,
  User as UserIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- MOCK DATA TEMAN ---
interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  status: "online" | "offline";
  lastSeen?: string;
}

const MOCK_FRIENDS: Friend[] = [
  {
    id: "f1",
    name: "Ahmad Zaki",
    email: "zaki@irmaverse.com",
    level: 12,
    xp: 2450,
    status: "online",
  },
  {
    id: "f2",
    name: "Siti Rahma",
    email: "rahma@irmaverse.com",
    level: 8,
    xp: 1200,
    status: "offline",
    lastSeen: "2 jam yang lalu",
  },
  {
    id: "f3",
    name: "Budi Santoso",
    email: "budi@irmaverse.com",
    level: 15,
    xp: 5000,
    status: "online",
  },
  {
    id: "f4",
    name: "Luthfi Hakim",
    email: "luthfi@irmaverse.com",
    level: 5,
    xp: 450,
    status: "offline",
    lastSeen: "Kemarin",
  }
];

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFriends = useMemo(() => {
    return MOCK_FRIENDS.filter((friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      <DashboardHeader />
      
      <div className="flex flex-1">
        {/* Sidebar Desktop */}
        <div className="hidden lg:block h-[calc(100vh-80px)] sticky top-20">
          <Sidebar />
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          
          {/* --- HEADER SECTON --- */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-xs font-black text-emerald-700 uppercase tracking-wider mb-3">
                <Users className="h-4 w-4" /> Komunitas
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-slate-800 leading-tight">
                Teman Belajar
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Temukan dan berinteraksi dengan teman sesama pejuang ilmu.
              </p>
            </div>

            <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 text-white font-black rounded-2xl border-b-4 border-emerald-700 hover:bg-emerald-600 active:translate-y-1 active:border-b-0 transition-all shadow-lg shadow-emerald-100">
              <UserPlus className="h-5 w-5" strokeWidth={3} />
              Cari Teman Baru
            </button>
          </div>

          {/* --- SEARCH & FILTER --- */}
          <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-4 lg:p-6 mb-8 shadow-[0_6px_0_0_#cbd5e1]">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Cari nama atau email teman..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-400 focus:bg-white rounded-2xl transition-all font-bold text-slate-700 outline-none"
              />
            </div>
          </div>

          {/* --- FRIENDS GRID --- */}
          {filteredFriends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-4 border-slate-100 border-dashed">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-700">Tidak ada teman ditemukan</h3>
              <p className="text-slate-400 font-medium">Coba gunakan kata kunci pencarian lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {filteredFriends.map((friend) => (
                <div 
                  key={friend.id}
                  className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1] hover:border-emerald-400 hover:shadow-[0_6px_0_0_#34d399] transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Status Indicator */}
                  <div className="absolute top-6 right-6 flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${friend.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                      {friend.status === 'online' ? 'Online' : friend.lastSeen}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-4 border-slate-50 shadow-sm">
                        <AvatarImage src={friend.avatar} alt={friend.name} />
                        <AvatarFallback className="bg-emerald-500 text-white font-black text-xl">
                          {friend.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-xl border-2 border-white shadow-sm">
                        <Trophy className="h-4 w-4" fill="currentColor" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                        {friend.name}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 truncate mb-2">{friend.email}</p>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg border border-amber-100 text-[10px] font-black uppercase">
                          <Zap className="h-3 w-3" fill="currentColor" />
                          Lvl {friend.level}
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase">{friend.xp} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 font-black rounded-xl border-2 border-emerald-100 hover:bg-emerald-100 transition-colors text-xs">
                      <MessageCircle className="h-4 w-4" /> Chat
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 font-black rounded-xl border-2 border-slate-100 hover:bg-slate-100 transition-colors text-xs">
                      <UserIcon className="h-4 w-4" /> Profil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}`  `