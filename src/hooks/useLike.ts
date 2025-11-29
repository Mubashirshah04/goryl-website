// ✅ AWS DYNAMODB - Firestore completely removed
// useLike hook - AWS DynamoDB implementation

import { useState, useEffect } from 'react';
import { likeItem, unlikeItem, isItemLiked } from '@/lib/awsLikeService';
import { toast } from 'sonner';

export const useLike = (productId: string, userId: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch initial like status
  useEffect(() => {
    if (!productId || !userId) return;

    const checkLikeStatus = async () => {
      try {
        const liked = await isItemLiked(userId, 'product', productId);
        setIsLiked(liked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();
  }, [productId, userId]);

  const toggleLike = async () => {
    if (!userId) {
      toast.error('Please login to like products');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      const newLikedState = !isLiked;

      // Optimistic update
      setIsLiked(newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

      // Update AWS
      if (newLikedState) {
        await likeItem(userId, 'product', productId);
        toast.success('Added to favorites!');
      } else {
        await unlikeItem(userId, 'product', productId);
        toast.success('Removed from favorites!');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : Math.max(0, prev - 1));
      toast.error('Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  return { isLiked, likeCount, toggleLike, loading };
};
