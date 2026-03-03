"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutGrid,
  BookOpen,
  Calendar,
  Users,
  GraduationCap,
  Trophy,
  Newspaper,
  Menu,
  PanelLeftClose,
  X,
  MessageCircle,
  HelpCircle,
  BookMarked,
  MessageSquare,
  Award,
  ChevronDown,
  Contact,
  Shield,
} from "lucide-react";

// Custom scrollbar styles - Cartoon Style
const scrollbarStyles = `
  .sidebar-scrollbar::-webkit-scrollbar {
    width: 10px;
  }
  .sidebar-scrollbar::-webkit-scrollbar-track {
    background: linear-gradient(180deg, #f0fdf4 0%, #f0fdf4 100%);
    border-radius: 10px;
  }
  .sidebar-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #10b981 0%, #14b8a6 100%);
    border-radius: 10px;
    border: 2px solid #059669;
    box-shadow: 0 0 0 2px rgba(16,185,129,0.2);
  }
  .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #059669 0%, #0d9488 100%);
    border-color: #047857;
  }
  .sidebar-scrollbar::-webkit-scrollbar-thumb:active {
    background: linear-gradient(180deg, #047857 0%, #065f46 100%);
    box-shadow: inset 0 0 0 2px rgba(5,150,105,0.3);
  }
  
  .mobile-sidebar-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .mobile-sidebar-scrollbar::-webkit-scrollbar-track {
    background: linear-gradient(180deg, #fefce8 0%, #fefce8 100%);
    border-radius: 4px;
  }
  .mobile-sidebar-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #f59e0b 0%, #f97316 100%);
    border-radius: 4px;
    border: 2px solid #ea580c;
    box-shadow: 0 0 0 2px rgba(249,115,22,0.2);
  }
  .mobile-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #ea580c 0%, #c2410c 100%);
    border-color: #b45309;
  }
  .mobile-sidebar-scrollbar::-webkit-scrollbar-thumb:active {
    background: linear-gradient(180deg, #b45309 0%, #92400e 100%);
    box-shadow: inset 0 0 0 2px rgba(217,119,6,0.3);
  }
`;

const Sidebar = () => {
  interface MenuItem {
    icon: any;
    label: string;
    path?: string;
    id?: string;
    submenu?: MenuItem[];
  }
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSubmenus, setExpandedSubmenus] = useState<{ [key: string]: boolean }>({});

  const role = session?.user?.role?.toLowerCase();
  const isInstruktur = role === "instruktur" || role === "instructor";
  const isAdmin = role === "admin";

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    if (saved !== null) {
      setIsExpanded(JSON.parse(saved));
    } else {
      const isMobile = window.innerWidth < 1024;
      setIsExpanded(!isMobile);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
    }
  }, [isExpanded, mounted]);

  useEffect(() => {
    const openHandler = () => setIsMobileOpen(true);
    const closeHandler = () => setIsMobileOpen(false);
    window.addEventListener('open-mobile-sidebar', openHandler as EventListener);
    window.addEventListener('close-mobile-sidebar', closeHandler as EventListener);
    return () => {
      window.removeEventListener('open-mobile-sidebar', openHandler as EventListener);
      window.removeEventListener('close-mobile-sidebar', closeHandler as EventListener);
    };
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobileOpen]);

  const getDashboardPath = () => {
    if (role === "instruktur") return "/academy";
    if (role === "admin") return "/admin";
    return "/overview"; 
  };

  const toggleSubmenu = (id: string) => {
    setExpandedSubmenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const baseMenuItems: MenuItem[] = [
    { 
      icon: LayoutGrid, 
      label: "Dashboard", 
      path: getDashboardPath()
    },
    { 
      icon: BookOpen, 
      label: (isInstruktur || isAdmin) ? "Kelola Kajian" : "Kajian Mingguanku", 
      path: (isInstruktur || isAdmin) ? "/materials" : undefined,
      id: "kajian",
      submenu: (!isInstruktur && !isAdmin) ? [
        {
          icon: Calendar,
          label: "Jadwal Kajian",
          path: "/materials"
        },
        {
          icon: BookMarked,
          label: "Rekapan Materi",
          path: "/materials/rekapan"
        },
        {
          icon: HelpCircle,
          label: "Kuis",
          path: "/quiz"
        }
      ] : undefined
    },
  ];

  const menuItems: MenuItem[] = [
    ...baseMenuItems,
    ...(!isInstruktur ? [
      { 
        icon: MessageSquare, 
        label: "Forum Diskusi", 
        path: "/chat-rooms" 
      }
    ] : []),
    { 
      icon: Award, 
      label: "Peringkat", 
      path: "/leaderboard" 
    },
    { 
      icon: Calendar, 
      label: "Event", 
      path: "/schedule" 
    },
    { 
      icon: GraduationCap, 
      label: "Program Kurikulum", 
      path: "/programs" 
    },
    { 
      icon: Trophy, 
      label: "Info Perlombaan", 
      path: "/competitions" 
    },
    // --- UPDATED SECTION: INSTRUKTUR & DAFTAR ANGGOTA ---
    ...(isInstruktur 
      ? [
          { 
            icon: Contact, 
            label: "Instruktur", 
            path: "/instructors" 
          },
          { 
            icon: Users, 
            label: "Daftar Anggota", 
            id: "menu-anggota",
            submenu: [
              {
                icon: Users,
                label: "List Anggota",
                path: "/members"
              },
              {
                icon: MessageCircle,
                label: "Chat Anggota",
                path: "/academy/chat"
              }
            ]
          }
        ]
      : [
          { 
            icon: Contact,
            label: "Instruktur", 
            id: "menu-instruktur",
            submenu: [
              {
                icon: Contact,
                label: "Daftar Instruktur",
                path: "/instructors"
              },
              {
                icon: MessageCircle,
                label: "Chat Instruktur",
                path: "/instructors/chat"
              }
            ]
          },
          { 
            icon: Users, 
            label: "Daftar Anggota", 
            path: "/members" 
          }
        ]
    ),
    // ----------------------------------------------------
    { 
      icon: Newspaper, 
      label: (isInstruktur || isAdmin) ? "Kelola Berita" : "Berita IRMA", 
      path: "/news" 
    },
    ...(isAdmin ? [
      {
        icon: Shield,
        label: "Kelola Akun",
        id: "menu-admin",
        submenu: [
          {
            icon: Users,
            label: "Kelola Akun User",
            path: "/admin/users"
          },
          {
            icon: Users,
            label: "Kelola Akun Instruktur",
            path: "/admin/instructors"
          }
        ]
      }
    ] : [])
  ];

  return (
    <>
      <style>{scrollbarStyles}</style>
      
      {/* --- DESKTOP SIDEBAR --- */}
      <div className={`hidden lg:flex flex-col shrink-0 sticky top-20 h-[calc(100vh-5rem)] bg-white border-r-2 border-slate-100 transition-all duration-300 ${isExpanded ? 'w-72' : 'w-24'}`}>
        
        {/* Toggle Button */}
        <div className="px-6 pt-6 pb-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-center p-3 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all duration-300 w-full border-2 border-transparent hover:border-teal-100"
                title={isExpanded ? "Persempit Sidebar" : "Perlebar Sidebar"}
            >
                {isExpanded ? (
                <div className="flex items-center gap-2 w-full">
                    <PanelLeftClose className="h-5 w-5 stroke-[2.5]" />
                    <span className="text-xs font-bold uppercase tracking-wider">Perkecil</span>
                </div>
                ) : (
                <Menu className="h-6 w-6 stroke-[2.5]" />
                )}
            </button>
        </div>

        {/* Menu Items Container */}
        <div className="flex-1 overflow-y-auto sidebar-scrollbar px-4 pb-8 space-y-1">
          {menuItems.map((item: MenuItem, idx) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.path;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = item.id && expandedSubmenus[item.id];

            return (
              <div key={idx} className="mb-1">
                <button
                  onClick={() => {
                    if (hasSubmenu) {
                      toggleSubmenu(item.id!);
                    } else if (item.path) {
                      router.push(item.path);
                    }
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden
                    ${isActive && !hasSubmenu
                      ? "bg-linear-to-r from-teal-400 to-emerald-500 text-white shadow-lg shadow-teal-200/50 translate-x-1"
                      : "text-slate-500 hover:bg-slate-50 hover:text-teal-600"
                    } 
                    ${!isExpanded && 'justify-center px-0'}
                  `}
                  title={!isExpanded ? item.label : ''}
                >
                  <IconComponent className={`h-[1.35rem] w-[1.35rem] shrink-0 stroke-[2.5] transition-colors ${isActive && !hasSubmenu ? 'text-white' : 'group-hover:text-teal-500'}`} />
                  
                  {isExpanded && (
                    <>
                      <span className={`text-sm font-bold flex-1 text-left ${isActive && !hasSubmenu ? 'font-black' : ''}`}>
                        {item.label}
                      </span>
                      {hasSubmenu && (
                        <ChevronDown 
                          className={`h-4 w-4 stroke-3 transition-transform duration-300 ${isSubmenuOpen ? 'rotate-180 text-teal-500' : 'text-slate-300'}`}
                        />
                      )}
                    </>
                  )}
                </button>
                
                {/* Submenu Desktop */}
                {hasSubmenu && isSubmenuOpen && isExpanded && (
                  <div className="mt-1 ml-5 pl-4 border-l-2 border-slate-100 space-y-1 animate-in slide-in-from-left-2 duration-200">
                    {item.submenu!.map((subitem: any, subidx: number) => {
                      const SubIconComponent = subitem.icon;
                      const isSubActive = pathname === subitem.path;
                      
                      return (
                        <button
                          key={subidx}
                          onClick={() => router.push(subitem.path)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left text-sm font-bold
                            ${isSubActive
                              ? "bg-teal-50 text-teal-600"
                              : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                            }
                          `}
                        >
                          <SubIconComponent className={`h-4 w-4 shrink-0 stroke-[2.5] ${isSubActive ? "text-teal-500" : ""}`} />
                          <span>{subitem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )} </div> 
            );
          })}
        </div>
      </div>

      {/* --- MOBILE SIDEBAR DRAWER --- */}
      {isMobileOpen && (
        <div className="lg:hidden">
            {/* Backdrop with enhanced blur */}
          <div
            className="fixed inset-0 z-40 bg-transparent animate-in fade-in duration-500"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Drawer Panel - iOS style spring animation */}
          <div className="fixed z-50 top-0 bottom-0 left-0 w-[82%] max-w-75 shadow-2xl animate-in slide-in-from-left duration-500 ease-out rounded-r-[2.5rem] overflow-hidden flex flex-col" style={{ zIndex: 2147483647, height: '100%' }}>
            
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-white z-0 pointer-events-none" />
            <div className="absolute top-0 right-0 w-full h-full opacity-5 bg-[radial-gradient(#14b8a6_1.5px,transparent_1.5px)] bg-size-[16px_16px] z-0 pointer-events-none" />
            
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-100/30 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="absolute top-1/4 -left-10 w-48 h-48 bg-amber-100/30 rounded-full blur-3xl pointer-events-none z-0" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none z-0" />

            {/* --- Content Container --- */}
            <div className="relative z-20 flex flex-col h-full pointer-events-auto">
              
              {/* Header Card - More compact */}
              <div className="px-5 pt-7 pb-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center">
                          <img src="/logo.webp" alt="IRMA Logo" className="h-9 w-9 object-contain" />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-slate-800 leading-none">IRMA VERSE</h2>
                        <p className="text-[9px] font-extrabold text-teal-600 uppercase tracking-widest mt-1">Platform resmi IRMA13</p>
                      </div>
                   </div>
                   <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 border border-slate-100"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <X className="h-4 w-4 stroke-3" />
                  </button>
                </div>
              </div>

              {/* Menu Items - Card Style per Item */}
              <div className="flex-1 overflow-y-auto mobile-sidebar-scrollbar px-5 py-2 space-y-3">
                {menuItems.map((item: MenuItem, idx) => {
                  const IconComponent = item.icon;
                  const isActive = pathname === item.path;
                  const hasSubmenu = item.submenu && item.submenu.length > 0;
                  const isSubmenuOpen = item.id && expandedSubmenus[item.id];

                  return (
                    <div key={idx} className="bg-white rounded-3xl border-2 border-white shadow-sm overflow-hidden">
                      <button
                        onClick={() => {
                          if (hasSubmenu) {
                            toggleSubmenu(item.id!);
                          } else if (item.path) {
                            setIsMobileOpen(false);
                            router.push(item.path);
                          }
                        }}
                        className={`
                          w-full flex items-center gap-4 px-4 py-3.5 transition-all duration-300 text-left relative
                          ${isActive && !hasSubmenu
                            ? "bg-linear-to-r from-teal-400 to-emerald-500 text-white shadow-lg shadow-teal-100"
                            : "text-slate-600 hover:bg-white/50 active:bg-white/80"
                          }
                        `}
                      >
                        <div className={`p-1.5 rounded-lg ${isActive && !hasSubmenu ? 'bg-white/20' : 'bg-slate-50'}`}>
                           <IconComponent className={`h-4.5 w-4.5 shrink-0 stroke-[2.5] ${isActive && !hasSubmenu ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                        <span className={`text-[15px] font-bold flex-1 ${isActive && !hasSubmenu ? 'font-black' : ''}`}>{item.label}</span>
                        {hasSubmenu && (
                          <ChevronDown 
                            className={`h-4 w-4 stroke-3 transition-transform duration-300 ${isSubmenuOpen ? 'rotate-180 text-teal-500' : 'text-slate-300'}`}
                          />
                        )}
                      </button>
                      
                      {/* Mobile Submenu */}
                      {hasSubmenu && isSubmenuOpen && (
                        <div className="bg-slate-50/50 border-t-2 border-slate-50 p-2 space-y-1">
                          {item.submenu!.map((subitem: any, subidx: number) => {
                            const SubIconComponent = subitem.icon;
                            const isSubActive = pathname === subitem.path;
                            
                            return (
                              <button
                                key={subidx}
                                onClick={() => {
                                  setIsMobileOpen(false);
                                  router.push(subitem.path);
                                }}
                                className={`
                                  w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left text-sm font-bold
                                  ${isSubActive
                                    ? "bg-teal-100 text-teal-700 border border-teal-200"
                                    : "text-slate-500 hover:bg-white border border-transparent"
                                  }
                                `}
                              >
                                <SubIconComponent className={`h-4 w-4 shrink-0 stroke-[2.5] ${isSubActive ? "text-teal-600" : "text-slate-400"}`} />
                                <span>{subitem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Mobile Footer */}
              <div className="p-5">
                  <div className="bg-white rounded-3xl border-2 border-white p-4 text-center shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        © 2026 Syntax 13
                    </p>
                  </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;