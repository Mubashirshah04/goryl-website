'use client';
import { Heart, MessageCircle, Share2, Bookmark, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLike } from '@/hooks/useLike';
import { useSave } from '@/hooks/useSave';
import { ShareModal } from '@/components/modals/ShareModal';
import { useState } from 'react';
import Link from 'next/link';
import { useCustomSession } from '@/hooks/useCustomSession';
import { GamePromptModal } from '@/components/modals/GamePromptModal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  brand: string;
  brandColor: string;
  tagline: string;
  likes: number;
  discount?: number;
}

export function ProductCard({ product }: { product: Product }) {
  const { session } = useCustomSession();
  const userId = session?.userId || '';
  const { isLiked, toggleLike, likeCount } = useLike(product.id, userId);
  const { isSaved, toggleSave } = useSave(product.id, userId);
  const [shareOpen, setShareOpen] = useState(false);
  const [gamePromptOpen, setGamePromptOpen] = useState(false);
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setGamePromptOpen(true);
  };

  const handlePlay = () => {
    setGamePromptOpen(false);
    router.push('/game');
  };

  const handleSkip = () => {
    setGamePromptOpen(false);
    router.push(`/product/${product.id}`);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="rounded-lg shadow-md overflow-hidden bg-white"
      >
        <Link href={`/product/${product.id}`}>
          <div className="relative aspect-square">
            <img
              src={product.images[0]}
              alt={product.title}
              className="object-cover w-full h-full"
            />
            {product.discount && product.discount > 0 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                {product.discount}% OFF
              </div>
            )}
          </div>
        </Link>
        <div className="p-3">
          <Link href={`/product/${product.id}`}>
            <h3 className="font-semibold truncate">{product.title}</h3>
            <p className="text-black dark:text-white font-bold">Rs {product.price}</p>
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <button onClick={toggleLike} className="flex items-center space-x-1">
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                <span className="text-xs text-gray-500">{likeCount}</span>
              </button>
              <button onClick={() => setShareOpen(true)}>
                <Share2 className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Professional Game Trigger Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setGamePromptOpen(true);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
              title="Play to Win Discount"
            >
              <Gamepad2 className="w-3 h-3" />
              <span>Win %</span>
            </button>
          </div>
        </div>
        <ShareModal open={shareOpen} setOpen={setShareOpen} url={`/product/${product.id}`} />
      </motion.div>

      <GamePromptModal
        isOpen={gamePromptOpen}
        onClose={() => setGamePromptOpen(false)}
        onPlay={handlePlay}
        onSkip={handleSkip}
        productImage={product.images[0]}
      />
    </>
  );
}
