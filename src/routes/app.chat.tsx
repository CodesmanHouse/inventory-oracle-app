import { useMemo, useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Pin, Bell, Phone, Video, Info, MessageSquare, Megaphone, Sparkles, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useChat, formatTime, ME_ID, type Channel, type Message } from "@/components/chat/chat-store";
import { MessageList } from "@/components/chat/MessageList";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { NewChannelDialog } from "@/components/chat/NewChannelDialog";

export const Route = createFileRoute("/app/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "Chatroom · Stackwise" }] }),
});

function ChatPage() {
  const { users, channels, messages, send, react, pin, createChannel, editMessage, deleteMessage } = useChat();
  const [activeId, setActiveId] = useState(channels[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "groups" | "dms">("all");
  const [showInfo, setShowInfo] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const active = channels.find((c) => c.id === activeId) ?? channels[0];
  const activeMessages = useMemo(() => messages.filter((m) => m.channelId === active?.id), [messages, active?.id]);
  const lastByChannel = useMemo(() => {
    const map = new Map<string, Message>();
    messages.forEach((m) => {
      const cur = map.get(m.channelId);
      if (!cur || new Date(m.createdAt) > new Date(cur.createdAt)) map.set(m.channelId, m);
    });
    return map;
  }, [messages]);

  const filteredChannels = useMemo(() => channels.filter((c) => {
    if (tab === "groups" && c.type === "dm") return false;
    if (tab === "dms" && c.type !== "dm") return false;
    if (!query) return true;
    return c.name.toLowerCase().includes(query.toLowerCase());
  }), [channels, tab, query]);

  const pinned = activeMessages.filter((m) => m.pinned);
  const myMentions = activeMessages.filter((m) => m.mentions.includes(ME_ID)).length;

  useEffect(() => { scrollEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeMessages.length]);

  function handleSend(body: string, attachments: any[], mentions: string[]) {
    if (!active) return;
    send(active.id, body, attachments, mentions, replyTo?.id);
    setReplyTo(null);
  }

  function handleEdit(m: Message) {
    const next = prompt("Edit message", m.body);
    if (next !== null && next.trim()) editMessage(m.id, next.trim());
  }

  return (
    <div className="-m-4 sm:-m-6 h-[calc(100vh-3.5rem)] flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r bg-white flex flex-col">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-emerald-600" />Chatroom</h2>
            <NewChannelDialog users={users} onCreate={(c) => { const created = createChannel(c); setActiveId(created.id); }} />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" className="h-8 pl-8 bg-muted/40 border-0 text-sm" />
          </div>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="px-2 pt-2">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">Groups</TabsTrigger>
            <TabsTrigger value="dms" className="text-xs">DMs</TabsTrigger>
          </TabsList>
        </Tabs>
        <ScrollArea className="flex-1">
          <div className="p-1.5 space-y-0.5">
            {filteredChannels.map((c) => {
              const last = lastByChannel.get(c.id);
              const isActive = c.id === active?.id;
              const lastAuthor = last ? userMap.get(last.authorId) : null;
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)} className={cn("w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors", isActive ? "bg-emerald-500/10" : "hover:bg-muted")}>
                  <ChannelAvatar channel={c} userMap={userMap} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm truncate", isActive ? "font-semibold text-emerald-800" : "font-medium")}>{c.name}</span>
                      {last && <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(last.createdAt)}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {last ? (
                        <>
                          {c.type !== "dm" && lastAuthor && <span className="font-medium">{lastAuthor.id === ME_ID ? "You" : lastAuthor.name.split(" ")[0]}: </span>}
                          {last.attachments.length > 0 && !last.body ? `📎 ${last.attachments.length} file${last.attachments.length > 1 ? "s" : ""}` : last.body || "—"}
                        </>
                      ) : "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </aside>

      {/* Conversation */}
      <main className="flex-1 flex flex-col min-w-0">
        {active && (
          <>
            <header className="h-14 border-b bg-white px-4 flex items-center gap-3">
              <ChannelAvatar channel={active} userMap={userMap} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{active.name}</h3>
                  {active.type === "broadcast" && <Badge className="bg-amber-500/10 text-amber-700"><Megaphone className="h-3 w-3 mr-1" />Broadcast</Badge>}
                  {myMentions > 0 && <Badge className="bg-rose-500/10 text-rose-700">@ {myMentions}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {active.type === "dm" ? (userMap.get(active.memberIds.find((id) => id !== ME_ID) ?? "")?.online ? "Online" : "Last seen recently") : `${active.memberIds.length} members · ${active.description ?? "Team channel"}`}
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
                <Button variant={showInfo ? "secondary" : "ghost"} size="icon" onClick={() => setShowInfo((s) => !s)}><Info className="h-4 w-4" /></Button>
              </div>
            </header>

            {pinned.length > 0 && (
              <div className="border-b bg-amber-50 px-4 py-1.5 flex items-center gap-2 text-xs">
                <Pin className="h-3.5 w-3.5 text-amber-600" />
                <span className="font-medium text-amber-900">Pinned:</span>
                <span className="truncate text-amber-800">{pinned[0].body}</span>
              </div>
            )}

            <MessageList
              messages={activeMessages}
              users={users}
              onReact={react}
              onPin={pin}
              onReply={(m) => setReplyTo(m)}
              onEdit={handleEdit}
              onDelete={deleteMessage}
            />
            <div ref={scrollEndRef} />

            <MessageComposer
              members={users.filter((u) => active.memberIds.includes(u.id))}
              onSend={handleSend}
              replyTo={replyTo ? { author: userMap.get(replyTo.authorId)?.name ?? "?", body: replyTo.body } : null}
              onClearReply={() => setReplyTo(null)}
            />
          </>
        )}
      </main>

      {/* Info panel */}
      {showInfo && active && (
        <aside className="hidden xl:flex w-72 shrink-0 border-l bg-white flex-col">
          <div className="p-4 border-b">
            <div className="flex flex-col items-center text-center">
              <div className="mb-2"><ChannelAvatar channel={active} userMap={userMap} size="lg" /></div>
              <h3 className="font-semibold">{active.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{active.description ?? `${active.memberIds.length} members`}</p>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Sparkles className="h-3 w-3" />Channel insight</p>
                <div className="rounded-lg border bg-gradient-to-br from-emerald-50 to-teal-50 p-3 text-xs">
                  <p className="font-medium text-emerald-900">{activeMessages.length} messages</p>
                  <p className="text-emerald-800 mt-0.5">{activeMessages.filter((m) => m.attachments.length).length} files shared · {activeMessages.reduce((s, m) => s + m.reactions.reduce((a, r) => a + r.userIds.length, 0), 0)} reactions</p>
                </div>
              </div>

              {pinned.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Pin className="h-3 w-3" />Pinned</p>
                  <div className="space-y-1.5">
                    {pinned.map((m) => (
                      <div key={m.id} className="rounded-lg border bg-amber-50/50 p-2 text-xs">
                        <p className="font-medium">{userMap.get(m.authorId)?.name}</p>
                        <p className="text-muted-foreground line-clamp-2">{m.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="h-3 w-3" />Members ({active.memberIds.length})</p>
                <div className="space-y-1">
                  {active.memberIds.map((id) => {
                    const u = userMap.get(id); if (!u) return null;
                    return (
                      <div key={id} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted/50">
                        <div className="relative">
                          <div className={cn("grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-white", u.color)}>
                            {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                          </div>
                          {u.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-tight truncate">{u.name} {u.id === ME_ID && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{u.role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Shared files</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {activeMessages.flatMap((m) => m.attachments).slice(0, 9).map((a) => (
                    <div key={a.id} className="aspect-square rounded-md bg-gradient-to-br from-emerald-100 to-teal-100 grid place-items-center text-[10px] text-emerald-800 font-medium p-1 text-center truncate">
                      {a.type === "image" && a.dataUrl ? <img src={a.dataUrl} alt="" className="h-full w-full object-cover rounded-md" /> : a.name.split(".").pop()?.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
      )}
    </div>
  );
}

function ChannelAvatar({ channel, userMap, size = "md" }: { channel: Channel; userMap: Map<string, any>; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "h-14 w-14 text-xl" : "h-9 w-9 text-base";
  if (channel.type === "dm") {
    const other = channel.memberIds.find((id) => id !== ME_ID);
    const u = other ? userMap.get(other) : null;
    if (u) return (
      <div className="relative shrink-0">
        <div className={cn("grid place-items-center rounded-full bg-gradient-to-br font-semibold text-white", dim, u.color)}>
          {u.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
        </div>
        {u.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />}
      </div>
    );
  }
  return <div className={cn("grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10", dim)}>{channel.emoji}</div>;
}
