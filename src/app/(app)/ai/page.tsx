"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePond } from "@/hooks/usePond";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bot, Send, Paperclip, X, Lightbulb, FlaskConical, Fish, Droplets,
  Image as ImageIcon, Plus, MessageSquare, Trash2, ChevronLeft, Menu,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AiChat, ChatMessage } from "@/types";
import { format } from "date-fns";

const QUICK_PROMPTS = [
  { icon: Fish, text: "তেলাপিয়ার সাধারণ রোগ কেমনে চিনবো?" },
  { icon: Droplets, text: "আমার পুকুরে পানির মান কেমন হওয়া উচিত?" },
  { icon: FlaskConical, text: "অ্যামোনিয়া বেশি হলে কী করবো?" },
  { icon: Lightbulb, text: "মাছের বৃদ্ধি দ্রুত করার টিপস" },
];

export default function AIPage() {
  const supabase = createClient();
  const { pond, stock } = usePond();

  const [chats, setChats] = useState<AiChat[]>([]);
  const [activeChat, setActiveChat] = useState<AiChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [mode, setMode] = useState<"chat" | "disease">("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);

  // ── Load chat list ─────────────────────────────────────────────────────────
  const loadChats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("ai_chats")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setChats((data as AiChat[]) ?? []);
    setLoadingChats(false);
  }, [supabase]);

  useEffect(() => { loadChats(); }, [loadChats]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Select chat ────────────────────────────────────────────────────────────
  function selectChat(chat: AiChat) {
    setActiveChat(chat);
    setMessages(chat.messages ?? []);
    setMode(chat.mode);
    setSidebarOpen(false);
  }

  // ── New chat ───────────────────────────────────────────────────────────────
  function newChat() {
    setActiveChat(null);
    setMessages([]);
    setInput("");
    setImagePreview(null);
    setImageFile(null);
    setSidebarOpen(false);
  }

  // ── Save messages to DB ────────────────────────────────────────────────────
  async function saveMessages(chatId: string, updatedMessages: ChatMessage[], title?: string) {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await supabase
        .from("ai_chats")
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
          ...(title ? { title } : {}),
        })
        .eq("id", chatId);
    } finally {
      savingRef.current = false;
    }
  }

  // ── Create new chat in DB ──────────────────────────────────────────────────
  async function createChatInDB(firstMessage: string, currentMode: "chat" | "disease"): Promise<AiChat | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const title = firstMessage.slice(0, 50) || "নতুন কথোপকথন";
    const { data, error } = await supabase
      .from("ai_chats")
      .insert({
        user_id: user.id,
        pond_id: pond?.id ?? null,
        title,
        mode: currentMode,
        messages: [],
      })
      .select()
      .single();
    if (error || !data) return null;
    return data as AiChat;
  }

  // ── Delete chat ────────────────────────────────────────────────────────────
  async function deleteChat(chatId: string, e: React.MouseEvent) {
    e.stopPropagation();
    await supabase.from("ai_chats").delete().eq("id", chatId);
    if (activeChat?.id === chatId) newChat();
    setChats(prev => prev.filter(c => c.id !== chatId));
  }

  // ── File handler ───────────────────────────────────────────────────────────
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Send message ───────────────────────────────────────────────────────────
  async function sendMessage(text?: string) {
    const content = text ?? input.trim();
    if (!content && !imageFile) return;
    setLoading(true);
    setInput("");

    const userMsg: ChatMessage = {
      role: "user",
      content,
      image: imagePreview ?? undefined,
      created_at: new Date().toISOString(),
    };

    let chat = activeChat;

    // Create conversation if first message
    if (!chat) {
      const newChatData = await createChatInDB(content, mode);
      if (!newChatData) { setLoading(false); return; }
      chat = newChatData;
      setActiveChat(chat);
      setChats(prev => [chat!, ...prev]);
    }

    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setImagePreview(null);
    setImageFile(null);

    try {
      const body = new FormData();
      body.append("message", content);
      body.append("mode", mode);
      if (pond) body.append("pondContext", JSON.stringify({ pond, stock }));
      if (imageFile) body.append("image", imageFile);
      body.append("history", JSON.stringify(messages.slice(-10)));

      const res = await fetch("/api/chat", { method: "POST", body });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
      };

      const withBoth = [...withUser, assistantMsg];
      setMessages(withBoth);

      // Persist to DB
      const isFirstExchange = withBoth.length <= 2;
      await saveMessages(
        chat.id,
        withBoth,
        isFirstExchange ? content.slice(0, 50) : undefined,
      );

      // Update local list
      setChats(prev => prev.map(c =>
        c.id === chat!.id
          ? { ...c, messages: withBoth, updated_at: new Date().toISOString(), title: isFirstExchange ? content.slice(0, 50) : c.title }
          : c
      ));
    } catch {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: "দুঃখিত, কিছু একটা ঠিক হয়নি। আবার চেষ্টা করুন।",
        created_at: new Date().toISOString(),
      };
      const withErr = [...withUser, errMsg];
      setMessages(withErr);
      if (chat) await saveMessages(chat.id, withErr);
    } finally {
      setLoading(false);
    }
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-100">
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={newChat}
          className="w-full flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
        >
          <Plus className="h-4 w-4" /> নতুন কথোপকথন
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loadingChats ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : chats.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8 px-4">এখনো কোনো কথোপকথন নেই</p>
        ) : (
          chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => selectChat(chat)}
              className={cn(
                "w-full flex items-start gap-2 rounded-xl px-3 py-2.5 text-left transition group",
                activeChat?.id === chat.id
                  ? "bg-brand-50 text-brand-700"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <MessageSquare className={cn(
                "h-4 w-4 mt-0.5 shrink-0",
                activeChat?.id === chat.id ? "text-brand-500" : "text-gray-400"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{chat.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {format(new Date(chat.updated_at), "MMM d, h:mm a")}
                </p>
              </div>
              <button
                onClick={(e) => deleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 hover:text-red-500 transition shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen page-enter overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex w-64 flex-col shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-72 flex flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-sm text-gray-900">ইতিহাস</p>
              <button onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar />
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* ── Main chat area ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-white">

        {/* Header */}
        <div className="flex items-center justify-between px-4 lg:px-5 py-3 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm leading-tight">AquaFarm AI</h1>
              <p className="text-[10px] text-gray-400">
                {activeChat ? activeChat.title : "মাছ চাষের বিশেষজ্ঞ"}
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setMode("chat")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                mode === "chat" ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>
              চ্যাট
            </button>
            <button onClick={() => setMode("disease")}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                mode === "disease" ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>
              রোগ শনাক্ত
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
                <Bot className="h-8 w-8 text-brand-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">
                  {mode === "disease" ? "মাছের রোগ শনাক্তকারী" : "মাছ চাষ নিয়ে যেকোনো প্রশ্ন করুন"}
                </h2>
                <p className="text-sm text-gray-500 max-w-sm">
                  {mode === "disease"
                    ? "মাছের ছবি আপলোড করুন এবং লক্ষণ বলুন। আমি সম্ভাব্য রোগ ও চিকিৎসা জানাবো।"
                    : `আপনার পুকুর (${pond?.name ?? "—"}) সম্পর্কে আমি জানি। ব্যক্তিগত পরামর্শ দিতে পারবো।`}
                </p>
              </div>
              {mode === "chat" && (
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
                    <button key={text} onClick={() => sendMessage(text)}
                      className="flex items-start gap-2 rounded-xl border border-gray-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 transition">
                      <Icon className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-700">{text}</span>
                    </button>
                  ))}
                </div>
              )}
              {mode === "disease" && (
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl border-2 border-dashed border-brand-300 px-6 py-4 text-brand-600 hover:bg-brand-50 transition">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">মাছের ছবি আপলোড করুন</span>
                </button>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                  <Bot className="h-4 w-4 text-brand-600" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "chat-bubble-user text-white rounded-tr-sm"
                  : "bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm"
              )}>
                {msg.image && (
                  <img src={msg.image} alt="uploaded" className="rounded-lg mb-2 max-h-48 object-cover" />
                )}
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                      h1: ({ children }) => <h1 className="text-base font-bold text-gray-900 mt-3 mb-1">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold text-gray-900 mt-3 mb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold text-gray-900 mt-2 mb-1">{children}</h3>,
                      ul: ({ children }) => <ul className="my-1 pl-4 space-y-0.5 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="my-1 pl-4 space-y-0.5 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      hr: () => <hr className="my-2 border-gray-200" />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                <Bot className="h-4 w-4 text-brand-600" />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="px-4 lg:px-6 pb-2">
            <div className="relative inline-block">
              <img src={imagePreview} alt="preview" className="h-20 w-20 rounded-xl object-cover border border-gray-200" />
              <button onClick={() => { setImagePreview(null); setImageFile(null); }}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-800 flex items-center justify-center">
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 lg:px-6 pb-4 lg:pb-6 pt-2 bg-white border-t border-gray-100 shrink-0">
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition">
              <Paperclip className="h-4 w-4 text-gray-400" />
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={mode === "disease" ? "লক্ষণ বলুন বা ছবি আপলোড করুন..." : "খাবার, পানির মান, রোগ নিয়ে জিজ্ঞেস করুন..."}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition max-h-32"
              style={{ minHeight: "42px" }}
            />
            <Button onClick={() => sendMessage()} disabled={!input.trim() && !imageFile} loading={loading}
              className="h-10 w-10 p-0 rounded-xl shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
