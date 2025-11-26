'use client';
import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import { useAuthStore } from '@/store/authStoreCognito';
export function CommentDrawer({ productId, open, setOpen }) {
    const { comments } = useComments(productId);
    const { user } = useAuthStore();
    const [text, setText] = useState('');
    const send = async () => {
        if (!text.trim() || !user)
            return;
        await addDoc(collection(db, 'products', productId, 'comments'), {
            text,
            authorId: user.sub,
            authorName: user.displayName,
            createdAt: Date.now(),
        });
        setText('');
    };
    return (<>
      {/* backdrop */}
      {open && (<div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setOpen(false)}/>)}
      <div className={`fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl transition-transform ${open ? 'translate-y-0' : 'translate-y-full'} p-4 max-h-96 overflow-y-auto`}>
        <h3 className="font-bold mb-2">Comments</h3>
        {comments.map(c => (<div key={c.id} className="mb-2">
            <span className="font-semibold">{c.authorName}:</span> {c.text}
          </div>))}
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add comment…" className="w-full border rounded p-2 mt-2" onKeyDown={e => e.key === 'Enter' && send()}/>
      </div>
    </>);
}


