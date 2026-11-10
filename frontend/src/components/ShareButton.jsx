import { useState } from "react";
import { Share2, Copy, Check, Send, MessageCircle, Facebook, Twitter, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const targets = (url, text) => [
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, color: "#25D366", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
  { id: "telegram", name: "Telegram", icon: Send, color: "#229ED9", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { id: "x", name: "X", icon: Twitter, color: "#ffffff", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
];

export const ShareButton = ({ title, url, label = "Share", className = "", testId = "share-button", iconOnly = false }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = url || window.location.href;
  const text = title ? `Watch "${title}" free on CineStream` : "Watch movies, TV & anime free on CineStream";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const t = document.createElement("textarea");
      t.value = link;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1800);
  };
  const native = () => navigator.share({ title: title || "CineStream", text, url: link }).catch(() => {});

  return (
    <>
      <button onClick={() => setOpen(true)} className={className} data-testid={testId} aria-label="Share">
        <Share2 size={18} />
        {!iconOnly && <span>{label}</span>}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-white/10 bg-[var(--surface)] text-white" data-testid="share-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Share {title ? `“${title}”` : "CineStream"}</DialogTitle>
            <DialogDescription className="text-gray-400">Send it to friends — they can start watching instantly.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3 pt-2">
            {targets(link, text).map(({ id, name, icon: Icon, color, href }) => (
              <a key={id} href={href} target="_blank" rel="noopener noreferrer" data-testid={`share-${id}`}
                className="group flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-white/5">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 transition-transform group-hover:scale-110" style={{ color }}>
                  <Icon size={22} />
                </span>
                <span className="text-xs text-gray-300">{name}</span>
              </a>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-1.5 pl-3">
            <span className="flex-1 truncate text-xs text-gray-400" data-testid="share-link-text">{link}</span>
            <button onClick={copy} className="btn-primary flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold" data-testid="share-copy-link">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {typeof navigator !== "undefined" && navigator.share && (
            <button onClick={native} className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm text-gray-300 hover:bg-white/5" data-testid="share-native">
              <MoreHorizontal size={16} /> More options
            </button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
