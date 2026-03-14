"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import SearchInput from "@/components/ui/SearchInput";
import SuccessDataFound from "@/components/ui/SuccessDataFound";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
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
  MessageCircle,  
  ArrowLeft,
  Loader2,
  Users,
  Inbox,
  X,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  ImageIcon,
  File,
  Shield,
} from "lucide-react";

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    email: string;
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

const InstructorChatDashboard = () => {
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
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
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
  
  const messagesRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Redirect if not instructor or admin
  useEffect(() => {
    const role = session?.user?.role?.toLowerCase();
    if (status === "authenticated" && role !== "instruktur" && role !== "admin") {
      router.push("/overview");
    }
  }, [session, status, router]);

  // Fetch conversations
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

  // Fetch messages for selected conversation
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

  // Initial load
  useEffect(() => {
    if (session?.user?.role === "instruktur") {
      fetchConversations();
    }
  }, [session, fetchConversations]);

  // Join/leave conversation rooms
  useEffect(() => {
    if (selectedConversationId) {
      joinConversation(selectedConversationId);
      fetchMessages(selectedConversationId);
      return () => {
        leaveConversation(selectedConversationId);
      };
    }
  }, [selectedConversationId, joinConversation, leaveConversation, fetchMessages]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      if (data.conversationId === selectedConversationId) {
        // Add message to current chat
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

        // Play notification sound if message from someone else
        if (data.senderId !== session?.user?.id) {
          playNotificationSound();
        }
      }

      // Update conversation list
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto mark messages as read when visible
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
          // Mark as read in database
          fetch("/api/chat/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageIds: unreadMessageIds }),
          }).catch(console.error);

          // Emit socket event
          socket?.emit("message:read", {
            conversationId: selectedConversationId,
            userId: session.user!.id,
            messageIds: unreadMessageIds,
          });

          // Update local state
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

    // Observe all message elements
    messageRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [messages, selectedConversationId, session?.user?.id, socket]);

  // Get selected conversation details
  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    return conversations.filter((conv) =>
      conv.participant.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  // Check if participant is online
  const isParticipantOnline = useCallback(
    (participantId: string) => onlineUsers.has(participantId),
    [onlineUsers]
  );

  // Get typing indicator for current conversation
  const currentTypingUsers = useMemo(() => {
    if (!selectedConversationId) return [];
    return typingUsers.get(selectedConversationId) || [];
  }, [selectedConversationId, typingUsers]);

  // Handle typing
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

  // File upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File terlalu besar! Maksimal 10MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Set file and show preview
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
    setFileCaption(messageDraft); // Use current draft as initial caption
    setShowFilePreview(true);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Send file after preview confirmation
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

      // Send message with attachment
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

  // Cancel file preview
  const handleCancelFilePreview = () => {
    setShowFilePreview(false);
    setSelectedFile(null);
    setFileCaption("");
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  // Edit message handler
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

  // Delete message handler
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

  // Delete entire conversation
  const handleDeleteConversation = async () => {
    if (!selectedConversationId) return;

    setDeletingConversation(true);
    try {
      const res = await fetch(`/api/chat/conversations/${selectedConversationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Remove from conversations list
        setConversations((prev) =>
          prev.filter((conv) => conv.id !== selectedConversationId)
        );
        setSelectedConversationId(null);
        setMessages([]);
        setShowDeleteConfirm(false);
        setIsMobileViewingChat(false);

        // Emit socket event
        socket?.emit("conversation:delete", {
          conversationId: selectedConversationId,
        });
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

  // Send message
  const handleSendMessage = async () => {
    const content = messageDraft.trim();
    if (!content || !selectedConversation || !session?.user) return;

    // Stop typing indicator
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

        // Emit via socket for real-time
        socket?.emit("message:send", {
          conversationId: selectedConversationId,
          senderId: session.user.id,
          recipientId: selectedConversation.participant.id,
          content,
          messageId: newMessage.id,
          senderName: session.user.name,
          createdAt: newMessage.createdAt,
        });

        // Don't add to local state here - let socket event handle it
        // This prevents duplicate messages on sender side
        setMessageDraft("");
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle Enter key
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Count total unread
  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);
  }, [conversations]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const role = session?.user?.role?.toLowerCase();
  if (status === "authenticated" && role !== "instruktur" && role !== "admin") {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100"
    >
      <DashboardHeader />
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="w-full flex-1 px-3 sm:px-4 lg:px-6 py-4 lg:py-5">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-3 lg:mb-4 flex items-center justify-between shrink-0">
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
                  Chat Anggota
                </h1>
                <p className="text-slate-500 font-bold text-xs lg:text-sm mt-0.5 lg:mt-1">
                  Kelola percakapan dengan peserta didik
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <span className="flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-100 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full border-2 border-emerald-200">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-white" />
                    Terhubung
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-xs font-black text-slate-500 bg-slate-100 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full border-2 border-slate-200">
                    <span className="w-2.5 h-2.5 bg-slate-400 rounded-full" />
                    Menghubungkan...
                  </span>
                )}
              </div>
            </div>

            {/* Chat Container */}
            <div className="rounded-2xl lg:rounded-3xl border-3 lg:border-4 border-slate-200 bg-white shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1] overflow-hidden flex flex-1 min-h-0">
              {/* Sidebar - Conversation List */}
              <div
                className={`${
                  isMobileViewingChat ? "hidden" : "flex"
                } lg:flex flex-col w-full lg:w-64 xl:w-80 border-r-3 lg:border-r-4 border-slate-100 bg-slate-50/30 min-h-0`}
              >
                {/* Search */}
                <div className="p-3 lg:p-4 border-b-2 border-slate-100 shrink-0">
                  <SearchInput
                    placeholder="Cari peserta..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                    className="w-full rounded-xl lg:rounded-2xl border-2"
                  />
                  {searchTerm && filteredConversations.length > 0 && (
                    <div className="mt-3">
                      <SuccessDataFound
                        message={`Ditemukan ${filteredConversations.length} chat peserta`}
                        icon="sparkles"
                      />
                    </div>
                  )}
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-2 min-h-0">
                  {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <Inbox className="h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-slate-500 text-sm">
                        Belum ada pesan masuk
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Peserta akan muncul di sini saat mereka memulai chat
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversationId(conv.id);
                          setIsMobileViewingChat(true);
                        }}
                        className={`w-full flex items-start gap-3 p-3 lg:p-4 rounded-2xl lg:rounded-3xl transition-all border-2 ${
                          selectedConversationId === conv.id
                            ? "bg-white border-emerald-400 shadow-[0_2px_0_0_#34d399] lg:shadow-[0_4px_0_0_#34d399] -translate-y-1 z-10"
                            : "bg-white border-transparent hover:border-slate-200 hover:shadow-sm"
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-slate-100 shadow-sm">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.participant.name}`}
                              alt={conv.participant.name || ""}
                            />
                            <AvatarFallback>
                              {conv.participant.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isParticipantOnline(conv.participant.id) && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-sm animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-slate-800 truncate text-sm">
                              {conv.participant.name}
                            </p>
                            {conv.lastMessage && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                                {formatRelativeTime(conv.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {isParticipantOnline(conv.participant.id)
                              ? "🟢 Online"
                              : "⚪ Offline"}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-xs text-slate-500 truncate mt-1 font-medium">
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md">
                            {conv.unreadCount}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div
                className={`${
                  isMobileViewingChat ? "flex" : "hidden"
                } lg:flex flex-col flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat min-h-0`}
              >
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-100 px-3 lg:px-6 py-3 lg:py-4 bg-white/90 backdrop-blur-md z-20 shrink-0">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsMobileViewingChat(false)}
                          className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="relative">
                          <Avatar className="h-11 w-11 border-2 border-white shadow-md ring-2 ring-slate-100">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.participant.name}`}
                              alt={selectedConversation.participant.name || ""}
                            />
                            <AvatarFallback>
                              {selectedConversation.participant.name
                                ?.slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isParticipantOnline(selectedConversation.participant.id) && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-bounce" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-lg leading-tight">
                            {selectedConversation.participant.name}
                          </p>
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            {isParticipantOnline(selectedConversation.participant.id) ? (
                              "Online"
                            ) : (
                              lastSeenMap.get(selectedConversation.participant.id) ? (
                                `Terakhir dilihat ${formatRelativeTime(lastSeenMap.get(selectedConversation.participant.id)!)}`
                              ) : (
                                "Offline"
                              )
                            )}
                            {currentTypingUsers.length > 0 && (
                              <span className="text-emerald-500 ml-1">
                                • Sedang mengetik...
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreHorizontal className="h-5 w-5 text-slate-500" />
                      </button>
                    </div>

                    {/* Messages Area */}
                    <div
                      ref={messagesRef}
                      className="flex-1 overflow-y-auto px-3 lg:px-6 py-4 lg:py-6 space-y-4 lg:space-y-6 min-h-0"
                    >
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                          <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
                          <p className="text-slate-500">Belum ada pesan</p>
                          <p className="text-slate-400 text-sm mt-1">
                            Peserta belum mengirim pesan
                          </p>
                        </div>
                      ) : (
                        <>
                          {messages.map((message, index) => {
                            const isCurrentUser = message.senderId === session?.user?.id;
                            const showDate =
                              index === 0 ||
                              new Date(message.createdAt).toDateString() !==
                                new Date(messages[index - 1].createdAt).toDateString();

                            return (
                              <React.Fragment key={message.id}>
                                {showDate && (
                                  <div className="flex items-center justify-center my-4 lg:my-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 lg:px-4 py-1 lg:py-1.5 rounded-full border-2 border-slate-200">
                                      {formatMessageDate(message.createdAt)}
                                    </span>
                                  </div>
                                )}
                                <div
                                  ref={(el) => {
                                    if (el) {
                                      messageRefs.current.set(message.id, el);
                                    } else {
                                      messageRefs.current.delete(message.id);
                                    }
                                  }}
                                  data-message-id={message.id}
                                  className={`flex ${
                                    isCurrentUser ? "justify-end" : "justify-start"
                                  } group`}
                                >
                                  <div className="flex items-end gap-2">
                                    {isCurrentUser && canEditOrDelete(message.createdAt) && !message.isDeleted && (
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 mb-2">
                                        <button
                                          className="p-1.5 bg-white border border-slate-200 rounded-full hover:bg-emerald-50 hover:text-emerald-500 shadow-sm transition-colors"
                                          onClick={() => {
                                            setEditingMessageId(message.id);
                                            setEditingContent(message.content);
                                          }}
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button
                                          className="p-1.5 bg-white border border-slate-200 rounded-full hover:bg-red-50 hover:text-red-500 shadow-sm transition-colors"
                                          onClick={() => handleDeleteMessage(message.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                    
                                    <div
                                      className={`relative px-4 lg:px-5 py-3 lg:py-4 shadow-sm border-2 max-w-[85%] sm:max-w-md ${
                                        isCurrentUser
                                          ? message.isDeleted
                                            ? "bg-slate-100 border-slate-300 text-slate-500 italic rounded-2xl lg:rounded-3xl"
                                            : "bg-linear-to-br from-emerald-400 to-teal-400 border-emerald-600 text-white rounded-3xl lg:rounded-4xl rounded-tr-none shadow-[2px_4px_0_0_#059669]"
                                          : message.isDeleted
                                          ? "bg-slate-50 border-slate-200 text-slate-400 italic rounded-2xl lg:rounded-3xl"
                                          : "bg-white border-slate-200 text-slate-800 rounded-3xl lg:rounded-4xl rounded-tl-none shadow-[2px_4px_0_0_#e2e8f0]"
                                      }`}
                                    >
                                      {editingMessageId === message.id ? (
                                        <div className="space-y-2">
                                          <Textarea
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            className="text-sm bg-white/10 border-white/20"
                                            rows={2}
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleEditMessage(message.id)}
                                              className="h-7 px-3 text-xs bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors"
                                            >
                                              Simpan
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingMessageId(null);
                                                setEditingContent("");
                                              }}
                                              className="h-7 px-3 text-xs hover:bg-white/20 text-white rounded-md transition-colors"
                                            >
                                              Batal
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          {message.attachmentUrl && (
                                            <div className="mb-2">
                                              {message.attachmentType === "image" ? (
                                                <img
                                                  src={message.attachmentUrl}
                                                  alt="Attachment"
                                                  className="rounded-lg max-w-full max-h-64 object-cover"
                                                />
                                              ) : (
                                                <a
                                                  href={message.attachmentUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center gap-2 p-2 bg-white/10 rounded-lg hover:bg-white/20"
                                                >
                                                  <File className="h-4 w-4" />
                                                  <span className="text-sm">File attachment</span>
                                                </a>
                                              )}
                                            </div>
                                          )}
                                          {message.content && (
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                              {message.content}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 mt-1">
                                            <p
                                              className={`text-[11px] ${
                                                isCurrentUser
                                                  ? "text-white/70"
                                                  : "text-slate-400"
                                              }`}
                                            >
                                              {formatTimeOnly(message.createdAt)}
                                              {message.isEdited && " (diedit)"}
                                            </p>
                                            {isCurrentUser && (
                                              <span className="text-white/70">
                                                {message.isRead ? (
                                                  <CheckCheck className="h-3.5 w-3.5" />
                                                ) : (
                                                  <Check className="h-3.5 w-3.5" />
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                          {currentTypingUsers.length > 0 && (
                            <div className="flex justify-start">
                              <div className="bg-slate-100 rounded-2xl px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                  <div
                                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.1s" }}
                                  />
                                  <div
                                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Message Input / Monitor Mode indicator */}
                    <div className="p-3 lg:p-4 bg-white/80 backdrop-blur-sm relative z-20 shrink-0">
                      {role === "admin" ? (
                        <div className="flex items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                          <div className="flex items-center gap-3 text-slate-400">
                            <Shield className="h-5 w-5" />
                            <p className="text-sm font-bold uppercase tracking-widest text-center">Mode Pemantauan: Admin tidak dapat mengirim pesan</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                          />
                          <div className="bg-white rounded-2xl lg:rounded-4xl border-2 border-slate-200 shadow-lg p-1.5 lg:p-2 flex items-end gap-2 focus-within:border-emerald-400 focus-within:shadow-[0_0_0_3px_rgba(52,211,153,0.2)] transition-all">
                            <button
                              type="button"
                              className="p-2 lg:p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all disabled:opacity-50 shrink-0"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingFile}
                            >
                              {uploadingFile ? (
                                <div className="flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                              ) : (
                                <Paperclip className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2.5} />
                              )}
                            </button>
                            
                            <Textarea
                              placeholder="Ketik pesan..."
                              value={messageDraft}
                              onChange={(e) => {
                                setMessageDraft(e.target.value);
                                handleTyping();
                              }}
                              onKeyDown={handleKeyDown}
                              className="flex-1 min-h-10 lg:min-h-12 max-h-28 lg:max-h-32 border-0 focus:ring-0 shadow-none resize-none py-2 lg:py-3 text-sm lg:text-base text-slate-700 font-medium placeholder:text-slate-400 bg-transparent"
                              rows={1}
                            />
                            
                            <button
                              onClick={handleSendMessage}
                              disabled={!messageDraft.trim()}
                              className="p-2 lg:p-3 bg-linear-to-r from-emerald-400 to-teal-400 text-white rounded-full shadow-[0_3px_0_0_#059669] lg:shadow-[0_4px_0_0_#059669] hover:-translate-y-1 hover:shadow-[0_5px_0_0_#059669] lg:hover:shadow-[0_6px_0_0_#059669] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none shrink-0"
                            >
                              <Send className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={3} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                    <div className="w-24 h-24 bg-emerald-50 rounded-4xl flex items-center justify-center mb-6 border-4 border-emerald-100 shadow-lg">
                      <MessageCircle className="h-12 w-12 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">
                      Pilih Percakapan
                    </h2>
                    <p className="text-slate-500 font-medium max-w-sm">
                      Pilih percakapan dari daftar di sebelah kiri atau tunggu peserta didik memulai chat
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* File Preview Modal */}
      {showFilePreview && selectedFile && filePreviewUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-4xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-white shadow-2xl transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">
                Preview File
              </h3>
              <button
                onClick={handleCancelFilePreview}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                disabled={uploadingFile}
              >
                <X className="h-6 w-6 text-slate-500" strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              {isImageFile(selectedFile.name) ? (
                <div className="p-2 bg-white rounded-2xl shadow-md">
                  <img
                    src={filePreviewUrl}
                    alt="Preview"
                    className="w-full h-auto rounded-xl border border-slate-200"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 bg-white border-4 border-slate-200 border-dashed rounded-3xl">
                  <File className="h-20 w-20 text-emerald-400 mb-4" />
                  <p className="text-slate-800 font-bold text-lg">{selectedFile.name}</p>
                  <p className="text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full mt-2">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 border-t-2 border-slate-100 bg-white">
              <Textarea
                placeholder="Tambahkan caption (opsional)..."
                value={fileCaption}
                onChange={(e) => setFileCaption(e.target.value)}
                className="mb-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-400 focus:shadow-[0_0_0_2px_#34d399] resize-none"
                rows={2}
                disabled={uploadingFile}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSendFile}
                  disabled={uploadingFile}
                  className="flex-1 bg-emerald-400 hover:bg-emerald-500 text-white font-black rounded-xl h-12 border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" strokeWidth={3} />
                      <span>Kirim</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelFilePreview}
                  disabled={uploadingFile}
                  className="px-6 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Conversation Confirmation Dialog */}
      {showDeleteConfirm && selectedConversation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-4xl w-full max-w-md shadow-2xl border-4 border-white transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b-2 border-slate-100">
              <h3 className="text-xl font-black text-slate-800">
                Hapus Percakapan
              </h3>
              <p className="text-slate-500 font-medium text-sm mt-1">
                Yakin ingin menghapus percakapan dengan {selectedConversation.participant.name}?
              </p>
            </div>

            <div className="p-6 bg-slate-50/50">
              <p className="text-sm text-slate-600 mb-4">
                Semua pesan dalam percakapan ini akan dihapus secara permanen dan tidak dapat dipulihkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletingConversation}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConversation}
                  disabled={deletingConversation}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl h-12 border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingConversation ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <span>Hapus Percakapan</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorChatDashboard;
