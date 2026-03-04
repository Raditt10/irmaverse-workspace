"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback, Suspense } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import DashboardHeader from "@/components/ui/Header";
import BackButton from "@/components/ui/BackButton";
import Sidebar from "@/components/ui/Sidebar";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";
import Loading from "@/components/ui/Loading";
import Toast from "@/components/ui/Toast";
// Import komponen Confirm Dialog yang baru
import CartoonConfirmDialog from "@/components/ui/ConfirmDialog"; 
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "@/lib/socket";
import {
  formatRelativeTime,
  formatMessageDate,
  formatTimeOnly,
  canEditOrDelete,
  playNotificationSound,
  isImageFile,
  formatFileSize,
} from "@/lib/chat-utils";
import {
  MoreHorizontal,
  Paperclip,
  Send,
  Search,
  MessageCircle,
  MessageSquarePlus,
  ArrowLeft,
  X,
  Edit2,
  Trash2,
  Heart,
  Check,
  CheckCheck,
  File,
  Loader2,
  Menu, // Import icon Menu
} from "lucide-react";

// ... (INTERFACES tetap sama) ...
interface Instructor {
  id: string;
  name: string;
  email: string;
  bidangKeahlian?: string;
  pengalaman?: string;
  hasConversation?: boolean;
  avatar?: string;
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    email: string;
    bidangKeahlian?: string;
    avatar?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  sender: {
    id: string;
    name: string;
  };
}

const ChatPage = () => {
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });

  const { 
    socket, 
    isConnected, 
    onlineUsers, 
    typingUsers, 
    lastSeenMap, 
    joinConversation, 
    leaveConversation, 
    startTyping, 
    stopTyping, 
  } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isMobileViewingChat, setIsMobileViewingChat] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileCaption, setFileCaption] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [isDesktopChatFullscreen, setIsDesktopChatFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const searchParams = useSearchParams();
  const autoInitRef = useRef<string | null>(null);

  // ... (Fungsi-fungsi fetch dan handler tetap sama) ...
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInstructors = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/instructors");
      if (res.ok) {
        const data = await res.json();
        setInstructors(data);
      }
    } catch (error) {
      console.error("Error fetching instructors:", error);
    }
  }, []);

  const startConversation = useCallback(async (instructorId: string) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorId }),
      });
      if (res.ok) {
        const conv = await res.json();
        await fetchConversations();
        setSelectedConversationId(conv.id);
        setShowNewChatModal(false);
        if (window.innerWidth < 1024) {
          setIsMobileViewingChat(true);
        }
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchInstructors();
  }, [fetchConversations, fetchInstructors]);

  useEffect(() => {
    if (loading) return; // tunggu sampai fetchConversations selesai
    const instructorId = searchParams.get("instructorId");
    if (!instructorId) return;

    // Supaya tidak terjadi looping create conversation
    if (autoInitRef.current === instructorId) return;

    const existingConv = conversations.find(
      (c) => c.participant.id === instructorId
    );

    if (existingConv) {
      if (selectedConversationId !== existingConv.id) {
        setSelectedConversationId(existingConv.id);
        if (window.innerWidth < 1024) {
          setIsMobileViewingChat(true);
        }
      }
    } else {
      // Tandai bahwa kita sedah mencoba untuk init percakapan ini secara otomatis
      autoInitRef.current = instructorId;
      startConversation(instructorId);
    }
  }, [searchParams, conversations, loading, selectedConversationId, startConversation]);

  useEffect(() => {
    if (selectedConversationId) {
      joinConversation(selectedConversationId);
      fetchMessages(selectedConversationId);
      return () => {
        leaveConversation(selectedConversationId);
      };
    }
  }, [selectedConversationId, joinConversation, leaveConversation, fetchMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      if (data.conversationId === selectedConversationId) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.messageId,
            senderId: data.senderId,
            content: data.content,
            createdAt: data.createdAt,
            isRead: false,
            isEdited: false,
            isDeleted: false,
            attachmentUrl: data.attachmentUrl,
            attachmentType: data.attachmentType,
            sender: {
              id: data.senderId,
              name: data.senderName,
            },
          },
        ]);

        if (data.senderId !== session?.user?.id) {
          playNotificationSound();
        }
      }
      fetchConversations();
    };

    const handleMessageEdited = (data: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, content: data.newContent, isEdited: true, editedAt: data.editedAt }
            : msg
        )
      );
    };

    const handleMessageDeleted = (data: any) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, content: "Pesan telah dihapus", isDeleted: true, deletedAt: data.deletedAt }
            : msg
        )
      );
    };

    const handleMessageReadUpdate = (data: any) => {
      if (data.userId !== session?.user?.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg.id) ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
          )
        );
      }
    };

    socket.on("message:receive", handleNewMessage);
    socket.on("message:edited", handleMessageEdited);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("message:read:update", handleMessageReadUpdate);

    return () => {
      socket.off("message:receive", handleNewMessage);
      socket.off("message:edited", handleMessageEdited);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("message:read:update", handleMessageReadUpdate);
    };
  }, [socket, selectedConversationId, fetchConversations, session?.user?.id]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!selectedConversationId || !session?.user?.id) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const unreadMessageIds = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.getAttribute("data-message-id"))
          .filter((id): id is string => {
            if (!id) return false;
            const message = messages.find((m) => m.id === id);
            return message ? !message.isRead && message.senderId !== session.user!.id : false;
          });

        if (unreadMessageIds.length > 0) {
          fetch("/api/chat/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageIds: unreadMessageIds }),
          }).catch(console.error);

          socket?.emit("message:read", {
            conversationId: selectedConversationId,
            userId: session.user!.id,
            messageIds: unreadMessageIds,
          });

          setMessages((prev) =>
            prev.map((msg) =>
              unreadMessageIds.includes(msg.id)
                ? { ...msg, isRead: true, readAt: new Date().toISOString() }
                : msg
            )
          );
        }
      },
      { threshold: 0.5 }
    );

    messageRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [messages, selectedConversationId, session?.user?.id, socket]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    return conversations.filter((conv) =>
      conv.participant.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  const isParticipantOnline = useCallback(
    (participantId: string) => onlineUsers.has(participantId),
    [onlineUsers]
  );

  const currentTypingUsers = useMemo(() => {
    if (!selectedConversationId) return [];
    return typingUsers.get(selectedConversationId) || [];
  }, [selectedConversationId, typingUsers]);

  const handleTyping = useCallback(() => {
    if (!selectedConversationId) return;
    startTyping(selectedConversationId);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedConversationId);
    }, 2000);
  }, [selectedConversationId, startTyping, stopTyping]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File terlalu besar! Maksimal 10MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
    setFileCaption(messageDraft);
    setShowFilePreview(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendFile = async () => {
    if (!selectedFile || !selectedConversation || !session?.user) return;
    setUploadingFile(true);
    setShowFilePreview(false);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();
      const res = await fetch(
        `/api/chat/conversations/${selectedConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: fileCaption.trim(),
            attachmentUrl: url,
            attachmentType: isImageFile(selectedFile.name) ? "image" : "file",
          }),
        }
      );
      if (res.ok) {
        const newMessage = await res.json();
        socket?.emit("message:send", {
          conversationId: selectedConversationId,
          senderId: session.user.id,
          recipientId: selectedConversation.participant.id,
          content: newMessage.content,
          messageId: newMessage.id,
          senderName: session.user.name,
          createdAt: newMessage.createdAt,
          attachmentUrl: url,
          attachmentType: newMessage.attachmentType,
        });
        setFileCaption("");
        setSelectedFile(null);
        setFilePreviewUrl(null);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Gagal mengupload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCancelFilePreview = () => {
    setShowFilePreview(false);
    setSelectedFile(null);
    setFileCaption("");
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent.trim() }),
      });
      if (res.ok) {
        const updatedMessage = await res.json();
        socket?.emit("message:edit", {
          messageId,
          conversationId: selectedConversationId,
          newContent: updatedMessage.content,
          editedAt: updatedMessage.editedAt,
        });
        setEditingMessageId(null);
        setEditingContent("");
      } else {
        const error = await res.json();
        alert(error.error || "Gagal mengedit pesan");
      }
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Gagal mengedit pesan");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Hapus pesan ini?")) return;
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const deletedMessage = await res.json();
        socket?.emit("message:delete", {
          messageId,
          conversationId: selectedConversationId,
          deletedAt: deletedMessage.deletedAt,
        });
      } else {
        const error = await res.json();
        alert(error.error || "Gagal menghapus pesan");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Gagal menghapus pesan");
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversationId) return;
    setDeletingConversation(true);
    try {
      const res = await fetch(`/api/chat/conversations/${selectedConversationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.filter((conv) => conv.id !== selectedConversationId)
        );
        setSelectedConversationId(null);
        setMessages([]);
        setShowDeleteConfirm(false); // Close dialog
        setIsMobileViewingChat(false);
        socket?.emit("conversation:delete", {
          conversationId: selectedConversationId,
        });
        setToast({ show: true, message: 'Percakapan berhasil dihapus', type: 'success' });
      } else {
        const error = await res.json();
        alert(error.error || "Gagal menghapus percakapan");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Gagal menghapus percakapan");
    } finally {
      setDeletingConversation(false);
    }
  };

  const handleSendMessage = async () => {
    const content = messageDraft.trim();
    if (!content || !selectedConversation || !session?.user) return;
    if (selectedConversationId) {
      stopTyping(selectedConversationId);
    }
    try {
      const res = await fetch(
        `/api/chat/conversations/${selectedConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      if (res.ok) {
        const newMessage = await res.json();
        socket?.emit("message:send", {
          conversationId: selectedConversationId,
          senderId: session.user.id,
          recipientId: selectedConversation.participant.id,
          content,
          messageId: newMessage.id,
          senderName: session.user.name,
          createdAt: newMessage.createdAt,
        });
        setMessageDraft("");
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };



  // --- RENDER ---

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat chat..." />
      </div>
    );
  }

  return (
    // Gunakan 100dvh untuk handle browser mobile address bar
    <div className="h-dvh bg-[#FDFBF7] flex flex-col overflow-hidden">
      
      {/* Hide header & sidebar on mobile when viewing chat to maximize space */}
      <div className={`${isMobileViewingChat || isDesktopChatFullscreen ? 'hidden lg:block' : 'block'}`}>
        <DashboardHeader />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Hide main sidebar on mobile or fullscreen desktop when viewing chat */}
        {/* PERBAIKAN: Ubah hidden lg:block menjadi block. Sidebar component sendiri yang handle responsiveness */}
        <div className={`${isMobileViewingChat || isDesktopChatFullscreen ? 'hidden lg:block' : 'block'} h-full shrink-0`}>
          <Sidebar />
        </div>

        <main className={`w-full flex-1 flex flex-col ${(isMobileViewingChat || isDesktopChatFullscreen) ? 'p-0' : 'p-4 lg:p-6'} overflow-hidden`}>
          
          {/* Page Title (Only visible on Desktop/Tablet or when List View on Mobile) */}
          <div className={`${isMobileViewingChat || isDesktopChatFullscreen ? 'hidden' : 'flex'} mb-4 items-center justify-between shrink-0 px-2 lg:px-0`}>
            <div className="flex items-center gap-3">
              {/* PERBAIKAN: Tombol Hamburger untuk Mobile */}
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-mobile-sidebar'))}
                className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Menu className="h-6 w-6" strokeWidth={2.5} />
              </button>
              
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Chat Instruktur</h1>
                <p className="text-slate-500 font-bold text-xs lg:text-sm mt-1">Konsultasi langsung dengan ahlinya</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
                {isConnected ? (
                  <span className="flex items-center gap-2 text-[10px] lg:text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full border-2 border-emerald-200">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-[10px] lg:text-xs font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border-2 border-slate-200">
                    <span className="w-2 h-2 bg-slate-400 rounded-full" />
                    Connecting...
                  </span>
                )}
            </div>
          </div>

          {/* CHAT CONTAINER FRAME */}
          <div className={`
            flex flex-1 bg-white overflow-hidden shadow-sm
            ${(isMobileViewingChat || isDesktopChatFullscreen) ? 'fixed inset-0 z-9999 w-screen h-screen rounded-none' : 'rounded-4xl border-4 border-slate-200 shadow-[0_8px_0_0_#cbd5e1]'}
          `}>
            
            {/* --- LIST CONVERSATIONS (SIDEBAR CHAT) --- */}
            <div className={`
              ${(isMobileViewingChat || isDesktopChatFullscreen) ? 'hidden' : 'flex'} 
              flex-col w-full lg:w-80 xl:w-96 border-r-0 lg:border-r-4 border-slate-100 bg-slate-50/30
            `}>
              {/* Search & New Chat Button */}
              <div className="p-4 border-b-2 border-slate-100 space-y-3 bg-white">
                <div className="relative group">
                  <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    placeholder="Cari chat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 lg:pl-11 bg-slate-50 border-2 border-slate-200 rounded-2xl h-12 focus:border-emerald-400 focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="w-full bg-emerald-400 hover:bg-emerald-500 text-white font-black rounded-2xl h-12 border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquarePlus className="h-5 w-5" strokeWidth={3} />
                  Chat Baru
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-2 border-slate-200">
                      <MessageCircle className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold">Belum ada percakapan</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversationId(conv.id);
                        if (window.innerWidth < 1024) { // hanya mobile/tablet
                          setIsMobileViewingChat(true);
                        }
                      }}
                      className={`w-full flex items-start gap-3 p-4 rounded-2xl transition-all border-2 text-left ${
                        selectedConversationId === conv.id
                          ? "bg-white border-emerald-400 shadow-[0_4px_0_0_#34d399] z-10"
                          : "bg-white border-transparent hover:border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-12 w-12 border-2 border-slate-100">
                          <AvatarImage src={conv.participant.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.participant.name}`} />
                          <AvatarFallback>{conv.participant.name?.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        {isParticipantOnline(conv.participant.id) && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className="font-bold text-slate-800 truncate">{conv.participant.name}</p>
                          {conv.lastMessage && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                              {formatRelativeTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                           <p className="text-xs text-slate-500 truncate font-medium max-w-[85%]">
                            {conv.lastMessage ? conv.lastMessage.content : <span className="italic opacity-70">Mulai percakapan...</span>}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="shrink-0 min-w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* --- ACTIVE CHAT WINDOW --- */}
            <div className={`
              ${(isMobileViewingChat || isDesktopChatFullscreen) ? 'flex' : 'hidden lg:flex'}
              flex-col flex-1 bg-slate-50 relative w-full h-full
              ${(isMobileViewingChat || isDesktopChatFullscreen) ? 'bg-white' : ''}
            `}>
              {selectedConversation ? (
                <>
                  {/* Active Chat Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-b-2 border-slate-100 shadow-sm z-20 shrink-0">
                    <div className="flex items-center gap-3">
                      <BackButton 
                        onClick={() => {
                          if (isMobileViewingChat) setIsMobileViewingChat(false);
                          else router.push('/instructors');
                        }}
                        className="p-2 -ml-2 bg-transparent border-none shadow-none hover:bg-slate-100 text-slate-600"
                        label=""
                      />
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-2 ring-slate-100">
                          <AvatarImage src={selectedConversation.participant.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.participant.name}`} />
                          <AvatarFallback>{selectedConversation.participant.name?.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        {isParticipantOnline(selectedConversation.participant.id) && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-base leading-tight line-clamp-1">
                          {selectedConversation.participant.name}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          {isParticipantOnline(selectedConversation.participant.id) ? (
                            <span className="text-emerald-500">Online</span>
                          ) : (
                            lastSeenMap.get(selectedConversation.participant.id) ? 
                            `Last seen ${formatRelativeTime(lastSeenMap.get(selectedConversation.participant.id)!)}` : "Offline"
                          )}
                          {currentTypingUsers.length > 0 && (
                            <span className="text-emerald-500 italic ml-1 animate-pulse">mengetik...</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsDesktopChatFullscreen((v) => !v)}
                        className="hidden lg:inline-flex p-2 rounded-full hover:bg-slate-100 text-slate-400"
                        title={isDesktopChatFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
                      >
                        {isDesktopChatFullscreen ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v2a2 2 0 002 2h2a2 2 0 002-2v-2m0-10V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2m10 10h-2a2 2 0 00-2 2v-2a2 2 0 002-2h2m-10 0H5a2 2 0 00-2 2v2a2 2 0 002 2h2" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6M4 4v6m0-6l6 6m10 10h-6m6 0v-6m0 6l-6-6" /></svg>
                        )}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu((v) => !v)}
                          className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                        >
                          <MoreHorizontal className="h-6 w-6" />
                        </button>
                        {showMenu && (
                          <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                            <button
                              onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                              className="w-full flex items-center gap-2 text-left px-4 py-3 hover:bg-slate-50 text-red-600 font-bold rounded-t-xl"
                            >
                              <Trash2 className="h-5 w-5 mr-2" />
                              Hapus Semua Pesan
                            </button>
                            
                            <button
                              onClick={() => {
                                setShowMenu(false);
                                setToast({ show: true, message: 'Berhasil ditambahkan ke Favorit!', type: 'success' });
                              }}
                              className="w-full flex items-center gap-2 text-left px-4 py-3 hover:bg-slate-50 text-emerald-600 font-bold rounded-b-xl"
                            >
                              <Heart className="h-5 w-5 mr-2" fill="currentColor" />
                              Tambahkan ke Favorit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages List Area */}
                  <div 
                    ref={messagesRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-100/50"
                  >
                    {messagesLoading ? (
                      <div className="flex justify-center pt-10"><Loading size="sm" /></div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full opacity-50">
                        <MessageCircle className="h-16 w-16 text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-400">Belum ada pesan</p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isMe = message.senderId === session?.user?.id;
                        const showDate = index === 0 || new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

                        return (
                          <React.Fragment key={message.id}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <span className="text-[10px] font-black text-slate-400 bg-white/80 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-sm">
                                  {formatMessageDate(message.createdAt)}
                                </span>
                              </div>
                            )}
                            <div 
                              ref={(el) => { if(el) messageRefs.current.set(message.id, el) }}
                              data-message-id={message.id}
                              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group`}
                            >
                              <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                
                                {/* Edit/Delete Buttons (Desktop hover, Mobile tap hold maybe?) */}
                                {isMe && canEditOrDelete(message.createdAt) && !message.isDeleted && (
                                  <div className="hidden group-hover:flex gap-1 mb-1 transition-opacity">
                                    <button onClick={() => { setEditingMessageId(message.id); setEditingContent(message.content); }} className="p-1 bg-white border border-slate-200 rounded-full shadow-sm text-slate-500 hover:text-emerald-500">
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button onClick={() => handleDeleteMessage(message.id)} className="p-1 bg-white border border-slate-200 rounded-full shadow-sm text-slate-500 hover:text-red-500">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}

                                <div className={`
                                  relative px-4 py-3 rounded-2xl shadow-sm border-2 text-sm md:text-base
                                  ${isMe 
                                    ? message.isDeleted ? 'bg-slate-100 border-slate-200 text-slate-400 italic' : 'bg-emerald-500 border-emerald-600 text-white rounded-tr-none shadow-[2px_3px_0_0_#047857]' 
                                    : message.isDeleted ? 'bg-slate-100 border-slate-200 text-slate-400 italic' : 'bg-white border-slate-200 text-slate-800 rounded-tl-none shadow-[2px_3px_0_0_#cbd5e1]'
                                  }
                                `}>
                                  {editingMessageId === message.id ? (
                                    <div className="min-w-50">
                                      <Textarea 
                                        value={editingContent} onChange={(e) => setEditingContent(e.target.value)} 
                                        className="text-sm bg-white/20 text-white border-white/30 focus:ring-0 mb-2"
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingMessageId(null)} className="text-xs text-white/80 font-bold px-2">Batal</button>
                                        <button onClick={() => handleEditMessage(message.id)} className="text-xs bg-white text-emerald-600 font-bold px-3 py-1 rounded-lg">Simpan</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {message.attachmentUrl && (
                                        <div className="mb-2 rounded-lg overflow-hidden border border-black/10 bg-black/5">
                                          {message.attachmentType === 'image' ? (
                                            <img src={message.attachmentUrl} alt="attachment" className="max-h-60 w-full object-cover" />
                                          ) : (
                                            <a href={message.attachmentUrl} target="_blank" className="flex items-center gap-2 p-3">
                                              <File className="h-5 w-5" />
                                              <span className="font-bold underline text-xs">Download File</span>
                                            </a>
                                          )}
                                        </div>
                                      )}
                                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-1 px-1 opacity-70">
                                  <span className="text-[10px] font-bold text-slate-500">{formatTimeOnly(message.createdAt)}</span>
                                  {isMe && (
                                    message.isRead ? <CheckCheck className="h-3 w-3 text-emerald-500" /> : <Check className="h-3 w-3 text-slate-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        )
                      })
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-3 lg:p-4 bg-white border-t-2 border-slate-100 z-20 shrink-0">
                    <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-3xl border-2 border-slate-200 focus-within:border-emerald-400 focus-within:shadow-[0_0_0_2px_rgba(52,211,153,0.2)] transition-all">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all shrink-0"
                      >
                        {uploadingFile ? <Loader2 className="h-6 w-6 animate-spin" /> : <Paperclip className="h-6 w-6" strokeWidth={2.5} />}
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx" />
                      </button>
                      
                      <Textarea
                        value={messageDraft}
                        onChange={(e) => { setMessageDraft(e.target.value); handleTyping(); }}
                        onKeyDown={handleKeyDown}
                        placeholder="Tulis pesan..."
                        className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 min-h-11 max-h-32 py-2.5 px-2 text-sm md:text-base font-medium text-slate-700 placeholder:text-slate-400 resize-none"
                        rows={1}
                      />
                      
                      <button 
                        onClick={handleSendMessage}
                        disabled={!messageDraft.trim() && !uploadingFile}
                        className="p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_3px_0_0_#047857] active:translate-y-0.5 active:shadow-none transition-all shrink-0"
                      >
                        <Send className="h-5 w-5" strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-100 animate-pulse">
                    <MessageCircle className="h-14 w-14 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2">Pilih Chat</h2>
                  <p className="text-slate-500 font-medium max-w-xs">
                    Pilih percakapan dari daftar atau mulai chat baru dengan instruktur.
                  </p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-8 bg-emerald-400 hover:bg-emerald-500 text-white font-black rounded-2xl h-12 px-8 border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
                  >
                    <MessageSquarePlus className="h-5 w-5" />
                    Mulai Chat Baru
                  </button>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* --- MODALS (Optimized for Mobile) --- */}
      
      {/* File Preview Modal */}
      {showFilePreview && selectedFile && filePreviewUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border-4 border-white shadow-2xl flex flex-col max-h-[90dvh]">
            <div className="p-4 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800">Preview File</h3>
              <button onClick={handleCancelFilePreview} className="p-2 hover:bg-slate-200 rounded-full"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
              {isImageFile(selectedFile.name) ? (
                <img src={filePreviewUrl} alt="Preview" className="max-w-full h-auto rounded-xl border-2 border-slate-200 shadow-md" />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border-2 border-slate-200">
                  <File className="h-16 w-16 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t-2 border-slate-100">
              <Textarea 
                value={fileCaption} onChange={(e) => setFileCaption(e.target.value)} 
                placeholder="Tambah caption..." 
                className="mb-3 rounded-xl border-2 border-slate-200" 
                rows={1}
              />
              <div className="flex gap-2">
                <button onClick={handleCancelFilePreview} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl">Batal</button>
                <button onClick={handleSendFile} disabled={uploadingFile} className="flex-1 py-3 font-bold text-white bg-emerald-500 rounded-xl shadow-[0_3px_0_0_#047857] active:translate-y-1 active:shadow-none">
                  {uploadingFile ? 'Mengirim...' : 'Kirim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[80dvh] flex flex-col overflow-hidden border-4 border-white shadow-2xl">
            <div className="p-4 border-b-2 border-slate-100 bg-emerald-50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-800">Pilih Instruktur</h3>
              <button onClick={() => setShowNewChatModal(false)} className="p-2 hover:bg-white rounded-xl"><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <div className="overflow-y-auto p-2">
              {instructors.length === 0 ? (
                <p className="text-center py-10 text-slate-400 font-medium">Tidak ada instruktur tersedia.</p>
              ) : (
                instructors.map(inst => (
                  <button key={inst.id} onClick={() => startConversation(inst.id)} className="w-full flex items-center gap-3 p-3 mb-1 hover:bg-slate-50 rounded-2xl border-2 border-transparent hover:border-slate-100 transition-all text-left">
                    <Avatar className="h-12 w-12 border-2 border-slate-100">
                      <AvatarImage src={inst.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inst.name}`} />
                      <AvatarFallback>{inst.name.slice(0,2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-slate-800">{inst.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{inst.bidangKeahlian || 'Instruktur'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CARTOON CONFIRM DIALOG --- */}
      {/* Menggantikan modal delete manual sebelumnya */}
      <CartoonConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConversation}
        title="Hapus Chat?"
        message="Apakah kamu yakin ingin menghapus semua pesan dalam percakapan ini? Tindakan ini tidak dapat dibatalkan."
        type="warning"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />

      {/* Toast notification */}
      {toast && (
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
};

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#FDFBF7]"><Loading /></div>}>
      <ChatPage />
    </Suspense>
  );
}