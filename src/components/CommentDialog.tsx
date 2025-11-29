'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCustomSession } from '@/hooks/useCustomSession';
import { toast } from 'sonner';
import { X, Send, Heart } from 'lucide-react';
import { getComments, addComment } from '@/lib/awsCommentService';
import ProfileImage from '@/components/ProfileImage';

interface CommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export default function CommentDialog({ isOpen, onClose, productId }: CommentDialogProps) {
  const { session: user } = useCustomSession();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments
  useEffect(() => {
    if (!isOpen || !productId) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        const data = await getComments(productId);
        setComments(data || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
    const interval = setInterval(fetchComments, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [isOpen, productId]);

  // Auto-scroll to bottom
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      await addComment({
        productId,
        userId: user.id || user.userId,
        userName: user.name || user.username || user.email || 'Anonymous',
        userPhoto: user.image || user.picture || '',
        comment: newComment.trim(),
      });

      setNewComment('');
      toast.success('Comment posted!');

      // Refresh comments
      const updatedComments = await getComments(productId);
      setComments(updatedComments || []);
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-background rounded-t-2xl md:rounded-2xl w-full md:w-full max-w-2xl md:max-h-[80vh] flex flex-col shadow-2xl z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background rounded-t-2xl md:rounded-t-2xl">
          <h2 className="text-lg font-bold text-foreground">Comments</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 pb-4 border-b border-border last:border-b-0">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <ProfileImage
                    user={{
                      picture: comment.userPhoto,
                      name: comment.userName,
                    }}
                    size={40}
                    className="rounded-full"
                  />
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground text-sm">
                      {comment.userName || 'Anonymous'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Recently'}
                    </span>
                  </div>

                  <p className="text-foreground text-sm break-words">
                    {comment.comment}
                  </p>

                  {/* Like Button */}
                  <button className="text-xs text-muted-foreground hover:text-red-500 mt-2 transition">
                    ❤️ Like
                  </button>
                </div>
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input */}
        <div className="border-t border-border p-4 bg-background sticky bottom-0 rounded-b-2xl md:rounded-b-2xl">
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            {user && (
              <ProfileImage
                user={{
                  picture: user.picture,
                  name: user.name,
                }}
                size={32}
                className="rounded-full"
              />
            )}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? 'Add a comment...' : 'Login to comment...'}
                disabled={!user || submitting}
                className="flex-1 bg-accent rounded-full px-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!user || !newComment.trim() || submitting}
                className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
