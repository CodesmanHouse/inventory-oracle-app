import { createContext, useContext, useState, type ReactNode, createElement } from "react";

export interface ChatUser {
  id: string;
  name: string;
  role: string;
  color: string;
  online: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: "image" | "doc" | "pdf" | "audio" | "other";
  dataUrl?: string;
}

export interface Reaction { emoji: string; userIds: string[] }

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  body: string;
  createdAt: string;
  mentions: string[];
  attachments: Attachment[];
  reactions: Reaction[];
  replyTo?: string;
  edited?: boolean;
  pinned?: boolean;
  systemEvent?: string;
}

export type ChannelType = "group" | "dm" | "broadcast";

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  emoji: string;
  description?: string;
  memberIds: string[];
  pinnedMessageIds: string[];
  createdAt: string;
}

export const ME_ID = "me";

const USERS: ChatUser[] = [
  { id: ME_ID, name: "You", role: "Admin", color: "from-emerald-500 to-teal-600", online: true },
  { id: "u1", name: "Aisha Mwangi", role: "Head of Ops", color: "from-rose-500 to-pink-600", online: true },
  { id: "u2", name: "Brian Otieno", role: "Inventory Mgr", color: "from-blue-500 to-indigo-600", online: true },
  { id: "u3", name: "Cynthia Wairimu", role: "Finance Lead", color: "from-amber-500 to-orange-600", online: false },
  { id: "u4", name: "David Kiplagat", role: "Procurement", color: "from-cyan-500 to-blue-600", online: false },
  { id: "u5", name: "Esther Naliaka", role: "Sales", color: "from-fuchsia-500 to-pink-600", online: true },
  { id: "u6", name: "Grace Akinyi", role: "HR", color: "from-lime-500 to-emerald-600", online: true },
  { id: "u7", name: "Hassan Abdi", role: "IT", color: "from-sky-500 to-cyan-600", online: false },
  { id: "u8", name: "Leonard Wafula", role: "Data", color: "from-violet-500 to-fuchsia-600", online: true },
];

const now = Date.now();
const t = (mins: number) => new Date(now - mins * 60000).toISOString();

const CHANNELS: Channel[] = [
  { id: "c1", name: "All-hands", type: "broadcast", emoji: "📣", description: "Company-wide announcements", memberIds: USERS.map((u) => u.id), pinnedMessageIds: ["m1"], createdAt: t(60 * 24 * 30) },
  { id: "c2", name: "Warehouse floor", type: "group", emoji: "📦", description: "Daily ops at Nairobi & Mombasa DCs", memberIds: [ME_ID, "u1", "u2", "u4"], pinnedMessageIds: [], createdAt: t(60 * 24 * 14) },
  { id: "c3", name: "Finance huddle", type: "group", emoji: "💰", description: "AR/AP, reconciliation, payroll", memberIds: [ME_ID, "u3", "u6"], pinnedMessageIds: [], createdAt: t(60 * 24 * 10) },
  { id: "c4", name: "Sales pipeline", type: "group", emoji: "🚀", description: "Live deals, quotes, LPOs", memberIds: [ME_ID, "u1", "u5", "u8"], pinnedMessageIds: [], createdAt: t(60 * 24 * 7) },
  { id: "c5", name: "Aisha Mwangi", type: "dm", emoji: "👤", memberIds: [ME_ID, "u1"], pinnedMessageIds: [], createdAt: t(60 * 24 * 3) },
  { id: "c6", name: "Hassan Abdi", type: "dm", emoji: "👤", memberIds: [ME_ID, "u7"], pinnedMessageIds: [], createdAt: t(60 * 24) },
];

const MESSAGES: Message[] = [
  { id: "m1", channelId: "c1", authorId: "u1", body: "Good morning team! Q2 close kicks off Monday. Please clear pending LPOs before end of week. @Cynthia Wairimu can you share the checklist?", createdAt: t(380), mentions: ["u3"], attachments: [], reactions: [{ emoji: "👍", userIds: [ME_ID, "u2", "u5"] }, { emoji: "🔥", userIds: ["u8"] }], pinned: true },
  { id: "m2", channelId: "c1", authorId: "u3", body: "On it 👌 Sharing the Q2-close checklist now.", createdAt: t(370), mentions: [], attachments: [{ id: "a1", name: "Q2-Close-Checklist.pdf", size: 184320, type: "pdf" }], reactions: [{ emoji: "🙌", userIds: [ME_ID, "u1"] }] },
  { id: "m3", channelId: "c1", authorId: "u6", body: "Reminder: medical-cover enrolment closes Friday.", createdAt: t(120), mentions: [], attachments: [], reactions: [] },

  { id: "m4", channelId: "c2", authorId: "u2", body: "Morning crew — cycle count for Bay 4 starts at 10. @You please approve the variance threshold.", createdAt: t(95), mentions: [ME_ID], attachments: [], reactions: [{ emoji: "✅", userIds: [ME_ID] }] },
  { id: "m5", channelId: "c2", authorId: "u4", body: "PO-2026-0184 received in full. Photos attached.", createdAt: t(60), mentions: [], attachments: [{ id: "a2", name: "delivery-bay4-01.jpg", size: 482300, type: "image" }, { id: "a3", name: "delivery-bay4-02.jpg", size: 391122, type: "image" }], reactions: [{ emoji: "📸", userIds: ["u1", "u2"] }] },
  { id: "m6", channelId: "c2", authorId: ME_ID, body: "Nice. Move the overflow to Aisle C-7 and tag the bin.", createdAt: t(55), mentions: [], attachments: [], reactions: [] },
  { id: "m7", channelId: "c2", authorId: "u1", body: "Heads-up: tomorrow's intake doubled. Bring in the temp pickers.", createdAt: t(20), mentions: [], attachments: [], reactions: [{ emoji: "💪", userIds: ["u2", "u4"] }] },

  { id: "m8", channelId: "c3", authorId: "u3", body: "Bank reconciliation for KCB done. Variance UGX 12,400 — investigating.", createdAt: t(140), mentions: [], attachments: [], reactions: [] },
  { id: "m9", channelId: "c3", authorId: "u6", body: "Payroll register attached for review.", createdAt: t(40), mentions: [ME_ID], attachments: [{ id: "a4", name: "Payroll-Mar-2026.xlsx", size: 88212, type: "doc" }], reactions: [{ emoji: "👀", userIds: [ME_ID] }] },

  { id: "m10", channelId: "c4", authorId: "u5", body: "Closed Acme Industries LPO — UGX 1.4M, delivery in 10 days. 🎉", createdAt: t(180), mentions: [], attachments: [], reactions: [{ emoji: "🎉", userIds: [ME_ID, "u1", "u8"] }, { emoji: "🥂", userIds: ["u1"] }] },
  { id: "m11", channelId: "c4", authorId: "u8", body: "Pipeline forecast for next 30 days — confidence 78%.", createdAt: t(15), mentions: [], attachments: [{ id: "a5", name: "Sales-Forecast-Apr.pdf", size: 221440, type: "pdf" }], reactions: [] },

  { id: "m12", channelId: "c5", authorId: "u1", body: "Hey — can we sync on the warehouse expansion at 3pm?", createdAt: t(25), mentions: [], attachments: [], reactions: [] },
  { id: "m13", channelId: "c5", authorId: ME_ID, body: "Works for me. I'll bring the lease draft.", createdAt: t(22), mentions: [], attachments: [], reactions: [{ emoji: "🙏", userIds: ["u1"] }] },

  { id: "m14", channelId: "c6", authorId: "u7", body: "Your VPN access has been renewed for 12 months.", createdAt: t(50), mentions: [], attachments: [], reactions: [] },
];

interface Ctx {
  users: ChatUser[];
  me: ChatUser;
  channels: Channel[];
  messages: Message[];
  send: (channelId: string, body: string, attachments: Attachment[], mentions: string[], replyTo?: string) => void;
  react: (messageId: string, emoji: string) => void;
  pin: (messageId: string) => void;
  createChannel: (c: Omit<Channel, "id" | "createdAt" | "pinnedMessageIds">) => Channel;
  editMessage: (id: string, body: string) => void;
  deleteMessage: (id: string) => void;
}

const ChatCtx = createContext<Ctx | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const value = useChatStore();
  return createElement(ChatCtx.Provider, { value }, children);
}

function useChatStore(): Ctx {
  const [users] = useState<ChatUser[]>(USERS);
  const [channels, setChannels] = useState<Channel[]>(CHANNELS);
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const me = users.find((u) => u.id === ME_ID)!;

  return {
    users, me, channels, messages,
    send: (channelId, body, attachments, mentions, replyTo) => {
      const m: Message = {
        id: `m${Date.now()}`, channelId, authorId: ME_ID, body, attachments, mentions, replyTo,
        createdAt: new Date().toISOString(), reactions: [],
      };
      setMessages((p) => [...p, m]);
    },
    react: (messageId, emoji) => setMessages((p) => p.map((m) => {
      if (m.id !== messageId) return m;
      const idx = m.reactions.findIndex((r) => r.emoji === emoji);
      if (idx === -1) return { ...m, reactions: [...m.reactions, { emoji, userIds: [ME_ID] }] };
      const r = m.reactions[idx];
      const has = r.userIds.includes(ME_ID);
      const nextUsers = has ? r.userIds.filter((u) => u !== ME_ID) : [...r.userIds, ME_ID];
      const nextReactions = [...m.reactions];
      if (nextUsers.length === 0) nextReactions.splice(idx, 1);
      else nextReactions[idx] = { ...r, userIds: nextUsers };
      return { ...m, reactions: nextReactions };
    })),
    pin: (messageId) => setMessages((p) => p.map((m) => m.id === messageId ? { ...m, pinned: !m.pinned } : m)),
    createChannel: (c) => {
      const next: Channel = { ...c, id: `c${Date.now()}`, createdAt: new Date().toISOString(), pinnedMessageIds: [] };
      setChannels((p) => [next, ...p]);
      return next;
    },
    editMessage: (id, body) => setMessages((p) => p.map((m) => m.id === id ? { ...m, body, edited: true } : m)),
    deleteMessage: (id) => setMessages((p) => p.filter((m) => m.id !== id)),
  };
}

export function useChat(): Ctx {
  const ctx = useContext(ChatCtx);
  const local = useChatStore();
  return ctx ?? local;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
