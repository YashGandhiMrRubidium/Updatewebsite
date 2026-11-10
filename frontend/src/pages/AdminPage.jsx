import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Show, UserButton, useAuth } from "@clerk/react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Seo } from "@/components/Seo";
import { api } from "@/lib/api";
import { AdsManager } from "@/components/admin/AdsManager";

const useAuthed = () => {
  const { getToken } = useAuth();
  return useCallback(async (method, url, data) => {
    const token = await getToken();
    return (await api.request({ method, url, data, headers: { Authorization: `Bearer ${token}` } })).data;
  }, [getToken]);
};

const EMPTY = { name: "", kind: "movie", movie_url: "", tv_url: "", anime_url: "", enabled: true };
const Field = ({ label, hint, ...p }) => (
  <label className="block space-y-1">
    <span className="text-xs font-semibold text-gray-300">{label}</span>
    <input {...p} className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
    {hint && <span className="text-[11px] text-gray-500">{hint}</span>}
  </label>
);

const ServerForm = ({ initial, onSave, onClose }) => {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg border-white/10 bg-[var(--surface)] text-white" data-testid="server-form-dialog">
        <DialogHeader>
          <DialogTitle className="font-display">{initial.id ? "Edit server" : "Add server"}</DialogTitle>
          <DialogDescription className="text-gray-400">Use placeholders: {"{id}"}, {"{season}"}, {"{episode}"}, {"{lang}"} (sub/dub), {"{dub}"} (true/false).</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
          <Field label="Name" value={f.name} onChange={set("name")} required maxLength={40} data-testid="server-form-name" />
          {!initial.id && (
            <div className="flex gap-2">
              {["movie", "anime"].map((k) => (
                <button type="button" key={k} onClick={() => setF({ ...f, kind: k })} data-testid={`server-form-kind-${k}`}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold ${f.kind === k ? "bg-[var(--brand)]" : "bg-white/5 text-gray-400"}`}>{k === "movie" ? "Movies & TV" : "Anime"}</button>
              ))}
            </div>
          )}
          {f.kind === "movie" ? (
            <>
              <Field label="Movie URL" value={f.movie_url} onChange={set("movie_url")} placeholder="https://site/embed/movie/{id}" data-testid="server-form-movie-url" />
              <Field label="TV URL" value={f.tv_url} onChange={set("tv_url")} placeholder="https://site/embed/tv/{id}/{season}/{episode}" data-testid="server-form-tv-url" />
            </>
          ) : (
            <Field label="Anime URL" value={f.anime_url} onChange={set("anime_url")} placeholder="https://site/stream/ani/{id}/{episode}/{lang}" hint="{id} is the AniList id" data-testid="server-form-anime-url" />
          )}
          <button type="submit" className="btn-primary w-full rounded-md py-2.5 font-semibold" data-testid="server-form-save">Save</button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ServerRow = ({ s, index, onToggle, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} data-testid={`admin-server-${s.id}`}
      className={`flex items-center gap-3 rounded-md border border-white/5 bg-[var(--surface)] px-3 py-2.5 ${isDragging ? "z-10 shadow-2xl ring-1 ring-[var(--brand)]" : ""}`}>
      <button {...attributes} {...listeners} className="cursor-grab touch-none text-gray-500 hover:text-white" aria-label="Drag" data-testid={`admin-drag-${s.id}`}><GripVertical size={18} /></button>
      <span className="w-6 font-mono text-xs text-gray-500">{index + 1}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${s.enabled ? "" : "text-gray-500 line-through"}`}>{s.name}</p>
        <p className="truncate font-mono text-[11px] text-gray-500">{s.kind === "anime" ? s.anime_url : s.movie_url || s.tv_url}</p>
      </div>
      <Switch checked={s.enabled} onCheckedChange={() => onToggle(s)} data-testid={`admin-toggle-${s.id}`} />
      <button onClick={() => onEdit(s)} className="rounded p-1.5 text-gray-400 hover:bg-white/5 hover:text-white" aria-label="Edit" data-testid={`admin-edit-${s.id}`}><Pencil size={15} /></button>
      <button onClick={() => onDelete(s)} className="rounded p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400" aria-label="Delete" data-testid={`admin-delete-${s.id}`}><Trash2 size={15} /></button>
    </div>
  );
};

const ServerManager = ({ call }) => {
  const [all, setAll] = useState([]);
  const [kind, setKind] = useState("movie");
  const [editing, setEditing] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const load = useCallback(() => call("get", "/admin/servers").then(setAll).catch(() => toast.error("Failed to load servers")), [call]);
  useEffect(() => { load(); }, [load]);
  const list = all.filter((s) => s.kind === kind);
  const body = ({ name, kind: k, movie_url, tv_url, anime_url, enabled }) => ({ name, kind: k, movie_url, tv_url, anime_url, enabled });

  const save = async (f) => {
    try {
      f.id ? await call("put", `/admin/servers/${f.id}`, body(f)) : await call("post", "/admin/servers", body(f));
      toast.success("Server saved");
      setEditing(null);
      load();
    } catch { toast.error("Could not save server"); }
  };
  const run = async (fn, ok) => {
    try { await fn(); if (ok) toast.success(ok); } catch { toast.error("Something went wrong"); }
    load();
  };
  const toggle = (s) => run(() => call("put", `/admin/servers/${s.id}`, body({ ...s, enabled: !s.enabled })));
  const remove = (s) => window.confirm(`Delete ${s.name}?`) && run(() => call("delete", `/admin/servers/${s.id}`), "Server deleted");
  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = list.map((s) => s.id);
    const next = arrayMove(list, ids.indexOf(active.id), ids.indexOf(over.id)).map((s, i) => ({ ...s, order: i }));
    setAll([...all.filter((s) => s.kind !== kind), ...next]);
    run(() => call("put", "/admin/servers-order", { kind, ids: next.map((s) => s.id) }), "Default order saved");
  };

  return (
    <section data-testid="admin-server-manager">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full bg-white/5 p-1">
          {[["movie", "Movies & TV"], ["anime", "Anime"]].map(([k, l]) => (
            <button key={k} onClick={() => setKind(k)} data-testid={`admin-kind-${k}`}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${kind === k ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}>{l} <span className="opacity-60">({all.filter((s) => s.kind === k).length})</span></button>
          ))}
        </div>
        <button onClick={() => setEditing({ ...EMPTY, kind })} className="btn-primary ml-auto flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold" data-testid="admin-add-server">
          <Plus size={16} /> Add server
        </button>
      </div>
      <p className="mb-3 text-xs text-gray-500">Drag to set the default order everyone sees. Viewers can still reorder on their own device.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={list.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">{list.map((s, i) => <ServerRow key={s.id} s={s} index={i} onToggle={toggle} onEdit={setEditing} onDelete={remove} />)}</div>
        </SortableContext>
      </DndContext>
      {editing && <ServerForm initial={editing} onSave={save} onClose={() => setEditing(null)} />}
    </section>
  );
};

const UsersPanel = ({ call }) => {
  const [d, setD] = useState(null);
  const load = useCallback(() => call("get", "/users").then(setD).catch(() => {}), [call]);
  useEffect(() => { load(); }, [load]);
  const change = async (uid, role) => {
    try { await call("patch", `/users/${uid}/role`, { role }); toast.success("Role updated"); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Could not change role"); }
  };
  if (!d) return null;
  return (
    <section data-testid="admin-users-panel">
      <h2 className="font-display mb-3 text-lg font-bold">Users</h2>
      <div className="space-y-2">
        {d.users.map((u) => (
          <div key={u.user_id} className="flex items-center gap-3 rounded-md border border-white/5 bg-[var(--surface)] px-3 py-2.5" data-testid={`admin-user-${u.user_id}`}>
            <span className="flex-1 truncate text-sm">{u.email || u.user_id}</span>
            <select value={u.role} onChange={(e) => change(u.user_id, e.target.value)} className="rounded border border-white/10 bg-black/40 px-2 py-1 text-sm" data-testid={`admin-user-role-${u.user_id}`}>
              {d.roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
};

const TABS = [["servers", "Servers"], ["ads", "Ads"], ["users", "Users"]];
const AdminTabs = ({ call }) => {
  const [tab, setTab] = useState("servers");
  return (
    <>
      <div className="mb-6 flex gap-1 border-b border-white/10">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} data-testid={`admin-tab-${k}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${tab === k ? "border-[var(--brand)] text-white" : "border-transparent text-gray-500 hover:text-white"}`}>{l}</button>
        ))}
      </div>
      {tab === "servers" && <ServerManager call={call} />}
      {tab === "ads" && <AdsManager call={call} />}
      {tab === "users" && <UsersPanel call={call} />}
    </>
  );
};

const AdminInner = () => {
  const call = useAuthed();
  const [me, setMe] = useState(null);
  useEffect(() => { call("get", "/me").then(setMe).catch(() => setMe({ role: "error" })); }, [call]);
  if (!me) return <div className="skeleton h-40 rounded-lg" />;
  if (me.role !== "admin")
    return (
      <div className="rounded-lg border border-white/10 bg-[var(--surface)] p-8 text-center" data-testid="admin-no-access">
        <p className="font-display text-xl font-bold">No admin access</p>
        <p className="mt-2 text-sm text-gray-400">This account ({me.email || "unknown"}) is not an admin.</p>
      </div>
    );
  return <AdminTabs call={call} />;
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-20 sm:px-8 sm:pt-24" data-testid="admin-page">
      <Seo title="Admin" />
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="text-[var(--brand)]" size={28} />
        <h1 className="font-display flex-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Admin</h1>
        <Show when="signed-in"><UserButton /></Show>
      </div>
      <Show when="signed-in"><AdminInner /></Show>
      <Show when="signed-out"><Navigate to="/sign-in" replace /></Show>
    </div>
  );
}
