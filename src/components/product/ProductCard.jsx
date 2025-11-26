'use client';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLike } from '@/hooks/useLike';
import { useSave } from '@/hooks/useSave';
import { ShareModal } from '@/components/modals/ShareModal';
import { useState } from 'react';
import Link from 'next/link';
export function ProductCard({ product }) {
    const { liked, toggleLike, likeCount } = useLike(product.id);
    const { saved, toggleSave } = useSave(product.id);
    const [shareOpen, setShareOpen] = useState(false);
    return (<motion.div whileHover={{ scale: 1.02 }} className="rounded-lg shadow-md overflow-hidden bg-white">
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square">
          <img src={product.images[0]} alt={product.title} className="object-cover w-full h-full"/>
        </div>
      </Link>
      <div className="p-3">
        <h3 className="font-semibold truncate">{product.title}</h3>
        <p className="text-pink-600 font-bold">${product.price}</p>
        <div className="flex items-center space-x-3 mt-2">
          <button onClick={toggleLike} className="flex items-center space-x-1">
            <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}/>
            <span>{likeCount}</span>
          </button>
          <button>
            <MessageCircle className="w-5 h-5 text-gray-500"/>
          </button>
          <button onClick={() => setShareOpen(true)}>
            <Share2 className="w-5 h-5 text-gray-500"/>
          </button>
          <button onClick={toggleSave}>
            <Bookmark className={`w-5 h-5 ${saved ? 'fill-black' : 'text-gray-500'}`}/>
          </button>
        </div>
      </div>
      <ShareModal open={shareOpen} setOpen={setShareOpen} url={`/product/${product.id}`}/>
    </motion.div>);
}
