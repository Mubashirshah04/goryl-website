import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { toast } from 'react-hot-toast';
import { Send, MessageCircle } from 'lucide-react';
import ProfileImage from '@/components/ProfileImage';
import { getComments, addComment, Comment } from '@/lib/awsCommentService';

interface ProductCommentsProps {
  productId: string;
}

export default function ProductComments({ productId }: ProductCommentsProps) {
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch comments from AWS DynamoDB
  useEffect(() => {
    if (!productId) return;

    const fetchComments = async () => {
      try {
        const fetchedComments = await getComments(productId);
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [productId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to ask a question');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please enter your question');
      return;
    }

    try {
      setSubmitting(true);

      const commentData = {
        productId,
        userId: user.uid, // Fixed: use uid instead of sub
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
        comment: newComment.trim(),
      };

      const addedComment = await addComment(commentData);

      // Optimistic update
      setComments(prev => [addedComment, ...prev]);

      toast.success('Question posted successfully!');
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return 'Recently';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ask a Question</h3>
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Question
            </label>
            <textarea
              value={newComment || ''}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ask other customers about this product..."
              maxLength={500}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {newComment.length}/500 characters
            </span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Posting...' : 'Post Question'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Questions & Answers ({comments?.length || 0})
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading questions...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">No questions yet. Be the first to ask about this product!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <ProfileImage
                    user={{ photoURL: comment.userPhoto, name: comment.userName }}
                    size={40}
                    className="rounded-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {comment.userName || 'User'}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{formatDate(comment.createdAt)}</span>
                  </div>

                  <p className="text-gray-700 mb-3">{comment.comment}</p>

                  {/* Reply Button */}
                  <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    Reply
                  </button>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-6 space-y-3">
                      {comment.replies.map((reply, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <ProfileImage
                                user={{ photoURL: reply.userPhoto, name: reply.userName }}
                                size={32}
                                className="rounded-full object-cover"
                              />
                            </div>
                            <h5 className="font-medium text-gray-900 text-sm">
                              {reply.userName || 'User'}
                            </h5>
                            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{formatDate(reply.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{reply.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



