"use client";

import { Suspense, useEffect, useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import SubscriptionGuard from "@/components/SubscriptionGuard";

type Message = {
  id: string;
  content: string | null;
  senderId: string;
  createdAt: string;
  type: string;
  sender?: {
    id: string;
    profile: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
  attachments?: Array<{
    id: string;
    url: string | null;
    kind: string;
  }>;
};

type UploadedAttachment = {
  url: string;
  name: string;
  size: number;
  mime: string;
};

type ConversationUser = {
  id: string;
  email: string;
  role: string;
  profile: {
    displayName: string;
    avatarUrl: string | null;
  } | null;
};

type ConversationItem = {
  id: string;
  missionId: string;
  missionTitle: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  otherUser: ConversationUser;
};

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get("conversation");

  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function isImageUrl(url: string) {
    return /\.(png|jpe?g|webp|gif)$/i.test(url);
  }

  function isVideoUrl(url: string) {
    return /\.(mp4|mov|webm)$/i.test(url);
  }

  function renderMessageBody(text: string, isMine: boolean) {
    const isUrl = /^https?:\/\//i.test(text) || text.startsWith("/uploads/");
    if (isUrl && isImageUrl(text)) {
      return (
        <div className="space-y-2">
          <Image
            src={text}
            alt="Image"
            width={280}
            height={280}
            className="rounded-xl object-cover max-h-72 w-auto shadow-lg"
          />
        </div>
      );
    }
    if (isUrl && isVideoUrl(text)) {
      return (
        <div className="space-y-2">
          <video controls className="rounded-xl max-h-72 shadow-lg">
            <source src={text} />
          </video>
        </div>
      );
    }
    if (isUrl) {
      return (
        <a
          href={text}
          className={`underline break-all text-sm ${isMine ? "text-cyan-200" : "text-cyan-400"}`}
          target="_blank"
          rel="noreferrer"
        >
          📎 {text.split("/").pop()}
        </a>
      );
    }
    return <p className="text-[15px] leading-relaxed">{text}</p>;
  }

  // Charger les données utilisateur et conversations
  useEffect(() => {
    async function fetchData() {
      try {
        const profileRes = await fetch("/api/profile");
        if (!profileRes.ok) {
          router.push("/login?callbackUrl=/messages");
          return;
        }
        const profileData = await profileRes.json();
        setUserId(profileData.user?.id || "current");

        // Petit délai pour s'assurer que la conversation est bien créée en base
        if (conversationIdParam) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Forcer un refresh des conversations (pas de cache)
        const convRes = await fetch("/api/conversations?" + Date.now());
        let existingConversations: ConversationItem[] = [];
        if (convRes.ok) {
          const convData = await convRes.json();
          existingConversations = convData.conversations || [];
        }

        setConversations(existingConversations);

        // Sélectionner la conversation depuis l'URL ou la première par défaut
        if (conversationIdParam) {
          const targetConv = existingConversations.find(c => c.id === conversationIdParam);
          if (targetConv) {
            setSelectedConversation(targetConv);
          } else if (existingConversations.length > 0) {
            // Si la conversation demandée n'est pas trouvée, prendre la plus récente
            // (qui est probablement celle qu'on vient de créer)
            setSelectedConversation(existingConversations[0]);
          }
        } else if (existingConversations.length > 0 && !selectedConversation) {
          setSelectedConversation(existingConversations[0]);
        }
      } catch {
        router.push("/login?callbackUrl=/messages");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, conversationIdParam]);

  useEffect(() => {
    if (!selectedConversation) return;

    async function fetchMessages() {
      const res = await fetch(`/api/messages?conversationId=${encodeURIComponent(selectedConversation!.id)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    }
    fetchMessages();

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Vérifier si l'utilisateur est bloqué quand on change de conversation
  useEffect(() => {
    if (!selectedConversation) {
      setIsBlocked(false);
      return;
    }
    async function checkBlocked() {
      try {
        const res = await fetch(`/api/users/${selectedConversation!.otherUser.id}/blocked`);
        if (res.ok) {
          const data = await res.json();
          setIsBlocked(data.isBlocked);
        }
      } catch (e) {
        console.error("Erreur vérification blocage:", e);
      }
    }
    checkBlocked();
  }, [selectedConversation]);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleBlockUser() {
    if (!selectedConversation) return;
    setBlockLoading(true);
    try {
      const res = await fetch("/api/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedConversation.otherUser.id })
      });
      if (res.ok) {
        setIsBlocked(true);
        setShowMenu(false);
      }
    } catch (e) {
      console.error("Erreur blocage:", e);
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleUnblockUser() {
    if (!selectedConversation) return;
    setBlockLoading(true);
    try {
      const res = await fetch(`/api/users/block?userId=${selectedConversation.otherUser.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setIsBlocked(false);
        setShowMenu(false);
      }
    } catch (e) {
      console.error("Erreur déblocage:", e);
    } finally {
      setBlockLoading(false);
    }
  }

  async function uploadFiles(files: FileList) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: UploadedAttachment[] = [];
      for (const file of list) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/messages/upload", {
          method: "POST",
          body: formData
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload échoué");
        }
        const data = await res.json();
        uploaded.push({
          url: data.url,
          name: data.name,
          size: data.size,
          mime: data.mime
        });
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erreur upload";
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      uploadFiles(e.target.files);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedConversation || (!body.trim() && attachments.length === 0)) return;
    setSending(true);

    try {
      if (body.trim()) {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: selectedConversation.id, content: body })
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => [...prev, data.message]);
        }
      }

      for (const att of attachments) {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: selectedConversation.id, content: att.url })
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => [...prev, data.message]);
        }
      }

      setBody("");
      setAttachments([]);

      window.dispatchEvent(new Event("refresh-notifications"));
    } finally {
      setSending(false);
    }
  }

  function handleSelectConversation(conv: ConversationItem) {
    setSelectedConversation(conv);
  }

  function removeAttachment(url: string) {
    setAttachments(prev => prev.filter(a => a.url !== url));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-[#000] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 h-screen flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Messages</h1>
            <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-full border border-white/10">
              🔒 Chiffré
            </span>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Conversations list - Hidden on mobile when a conversation is selected */}
          <aside className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 rounded-2xl bg-[#0a0a0a] border border-white/[0.06] overflow-hidden flex-col`}>
            {/* Search */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full rounded-xl p-3 text-left transition-all flex items-center gap-3 mb-1 ${
                      selectedConversation?.id === conv.id
                        ? "bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20"
                        : "hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    <div className="relative">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-bold text-slate-900 overflow-hidden">
                        {conv.otherUser.profile?.avatarUrl ? (
                          <Image
                            src={conv.otherUser.profile.avatarUrl}
                            alt={conv.otherUser.profile?.displayName || "Avatar"}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (conv.otherUser.profile?.displayName || conv.otherUser.email).charAt(0).toUpperCase()
                        )}
                      </div>
                      {/* Unread indicator */}
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">
                        {conv.otherUser.profile?.displayName || conv.otherUser.email}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {conv.missionTitle}
                      </p>
                      {conv.lastMessagePreview && (
                        <p className="text-xs text-white/30 truncate mt-0.5">
                          {conv.lastMessagePreview}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] mb-4">
                    <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-white/40">Aucune conversation</p>
                  <p className="text-xs text-white/20 mt-1">Commencez à discuter depuis la recherche</p>
                </div>
              )}
            </div>
          </aside>

          {/* Chat area - Full width on mobile when conversation selected */}
          <section className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 rounded-2xl bg-[#0a0a0a] border border-white/[0.06] flex-col overflow-hidden`}>
            {selectedConversation ? (
              <>
                {/* Chat header */}
                <div className="border-b border-white/[0.06] p-4 flex items-center justify-between bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    {/* Back button - Mobile only */}
                    <button
                      type="button"
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden h-10 w-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors mr-1"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="relative">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-bold text-slate-900 overflow-hidden">
                        {selectedConversation.otherUser.profile?.avatarUrl ? (
                          <Image
                            src={selectedConversation.otherUser.profile.avatarUrl}
                            alt={selectedConversation.otherUser.profile?.displayName || "Avatar"}
                            width={44}
                            height={44}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (selectedConversation.otherUser.profile?.displayName || selectedConversation.otherUser.email).charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#0a0a0a]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-[15px]">
                        {selectedConversation.otherUser.profile?.displayName || selectedConversation.otherUser.email}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-cyan-400 truncate max-w-[120px] md:max-w-none">
                          {selectedConversation.missionTitle}
                        </span>
                        <span className="text-white/20 hidden md:inline">•</span>
                        <span className="text-xs text-white/40 hidden md:inline">
                          {selectedConversation.otherUser.role === "CREATOR" ? "Créateur" : "Designer"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Menu dropdown */}
                  <div className="relative" ref={menuRef}>
                    <button 
                      onClick={() => setShowMenu(!showMenu)}
                      className="h-9 w-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#1a1a1a] border border-white/[0.1] shadow-xl z-50 overflow-hidden">
                        {isBlocked ? (
                          <button
                            onClick={handleUnblockUser}
                            disabled={blockLoading}
                            className="w-full px-4 py-3 text-left text-sm text-emerald-400 hover:bg-white/[0.05] transition-colors flex items-center gap-3 disabled:opacity-50"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {blockLoading ? "Déblocage..." : "Débloquer"}
                          </button>
                        ) : (
                          <button
                            onClick={handleBlockUser}
                            disabled={blockLoading}
                            className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/[0.05] transition-colors flex items-center gap-3 disabled:opacity-50"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            {blockLoading ? "Blocage..." : "Bloquer cet utilisateur"}
                          </button>
                        )}
                        
                        <div className="border-t border-white/[0.06]" />
                        
                        <button
                          onClick={() => setShowMenu(false)}
                          className="w-full px-4 py-3 text-left text-sm text-white/50 hover:bg-white/[0.05] transition-colors flex items-center gap-3"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Fermer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={chatContainerRef}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex-1 overflow-y-auto p-6 space-y-4 transition-colors ${isDragging ? "bg-cyan-500/5" : ""}`}
                >
                  {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-2xl">
                      <div className="text-center">
                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                          <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-white font-medium">Déposez vos fichiers ici</p>
                        <p className="text-white/50 text-sm">Images, vidéos, documents...</p>
                      </div>
                    </div>
                  )}

                  {messages.length > 0 ? (
                    messages.map((m, index) => {
                      const isMine = m.senderId === userId;
                      const showAvatar = index === 0 || messages[index - 1]?.senderId !== m.senderId;
                      
                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
                        >
                          {!isMine && showAvatar ? (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-xs font-bold text-slate-900 overflow-hidden">
                              {selectedConversation.otherUser.profile?.avatarUrl ? (
                                <Image
                                  src={selectedConversation.otherUser.profile.avatarUrl}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                (selectedConversation.otherUser.profile?.displayName || selectedConversation.otherUser.email).charAt(0).toUpperCase()
                              )}
                            </div>
                          ) : !isMine ? (
                            <div className="w-8" />
                          ) : null}
                          
                          <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                isMine
                                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-br-md"
                                  : "bg-white/[0.05] border border-white/[0.08] text-white rounded-bl-md"
                              }`}
                            >
                              {renderMessageBody(m.content || "", isMine)}
                            </div>
                            <p className={`text-[10px] mt-1 ${isMine ? "text-right text-white/30" : "text-white/30"}`}>
                              {new Date(m.createdAt).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                              {isMine && <span className="ml-1">✓✓</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                        <svg className="h-10 w-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-white/50 font-medium">Démarrez la conversation</p>
                      <p className="text-white/30 text-sm mt-1">Envoyez votre premier message 👋</p>
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div className="border-t border-white/[0.06] p-4 bg-white/[0.01]">
                  {/* Indicateur de blocage */}
                  {isBlocked && (
                    <div className="mb-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                      <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-medium">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Vous avez bloqué cet utilisateur
                      </div>
                      <button
                        onClick={handleUnblockUser}
                        disabled={blockLoading}
                        className="mt-2 text-xs text-white/50 hover:text-emerald-400 transition-colors"
                      >
                        {blockLoading ? "Déblocage..." : "Débloquer pour reprendre la conversation"}
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {attachments.map((att) => (
                        <div key={att.url} className="group relative rounded-lg bg-white/[0.03] border border-white/[0.08] p-2 pr-8">
                          <p className="text-xs text-white font-medium truncate max-w-[120px]">{att.name}</p>
                          <p className="text-[10px] text-white/40">{(att.size / 1024).toFixed(0)} Ko</p>
                          <button
                            onClick={() => removeAttachment(att.url)}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="h-11 w-11 shrink-0 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileInput}
                    />

                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={isBlocked ? "Utilisateur bloqué" : "Écrivez un message..."}
                        disabled={isBlocked}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sending || uploading || isBlocked || (!body.trim() && attachments.length === 0)}
                      className="h-11 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-semibold text-slate-900 transition-all hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2"
                    >
                      {sending ? (
                        <div className="h-4 w-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      ) : (
                        <>
                          Envoyer
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 flex items-center justify-center mb-6">
                  <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Vos messages</h3>
                <p className="text-white/40 text-center max-w-xs">
                  Sélectionnez une conversation pour commencer à discuter
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
    </SubscriptionGuard>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000] flex items-center justify-center text-white">Chargement...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
