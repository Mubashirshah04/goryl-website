'use client';
import { Facebook, Twitter, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function ShareModal({ open, setOpen, url }: { open: boolean; setOpen: (open: boolean) => void; url: string }) {
  const full = `${location.origin}${url}`;
  
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Check this out!', url: full });
    } else {
      navigator.clipboard.writeText(full);
      toast.success('Link copied!');
    }
  };

  return (
    open && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded p-6 max-w-xs w-full">
          <h3 className="font-bold mb-4">Share</h3>
          <button onClick={share} className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded">
            <Copy size={20} /> Copy Link
          </button>
          <button
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(full)}`)}
            className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded"
          >
            <Facebook size={20} /> Facebook
          </button>
          <button
            onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(full)}`)}
            className="flex items-center gap-2 w-full p-2 hover:bg-gray-100 rounded"
          >
            <Twitter size={20} /> Twitter
          </button>
          <button onClick={() => setOpen(false)} className="mt-4 w-full text-sm underline">
            Close
          </button>
        </div>
      </div>
    )
  );
}
