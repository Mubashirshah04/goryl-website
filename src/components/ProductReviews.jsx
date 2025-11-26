'use client';
import React, { useState } from 'react';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import { useAuthStore } from '@/store/authStoreCognito';
import { toast } from 'sonner';
import { Star, ThumbsUp, MessageCircle, User } from 'lucide-react';
export default function ProductReviews({ productId, reviews = [], productRating = 0, reviewCount = 0 }) {
    const { user } = useAuthStore();
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to submit a review');
            return;
        }
        if (!title.trim() || !comment.trim()) {
            toast.error('Please fill in all fields');
            return;
        }
        setSubmitting(true);
        try {
            const reviewData = {
                productId,
                userId: user.sub,
                userName: user.displayName || 'Anonymous',
                userPhoto: user.photoURL,
                rating,
                title: title.trim(),
                comment: comment.trim(),
                createdAt: serverTimestamp(),
                helpful: 0
            };
            await addDoc(collection(db, 'reviews'), reviewData);
            // Update product rating and review count
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, {
                reviewCount: increment(1),
                rating: increment(rating)
            });
            toast.success('Review submitted successfully!');
            setShowReviewForm(false);
            setTitle('');
            setComment('');
            setRating(5);
        }
        catch (error) {
            console.error('Error submitting review:', error);
            toast.error('Failed to submit review');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleHelpful = async (reviewId) => {
        if (!user) {
            toast.error('Please login to mark reviews as helpful');
            return;
        }
        try {
            const reviewRef = doc(db, 'reviews', reviewId);
            await updateDoc(reviewRef, {
                helpful: increment(1)
            });
            toast.success('Marked as helpful!');
        }
        catch (error) {
            console.error('Error marking helpful:', error);
            toast.error('Failed to mark as helpful');
        }
    };
    const formatDate = (timestamp) => {
        if (!timestamp)
            return 'Recently';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (<Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}/>));
    };
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : productRating;
    return (<div className="space-y-6">
      {/* Review Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</div>
            <div className="flex items-center justify-center mt-1">
              {renderStars(Math.round(averageRating))}
            </div>
            <div className="text-sm text-gray-600 mt-1">{reviewCount} reviews</div>
          </div>
        </div>
        
        <button onClick={() => setShowReviewForm(!showReviewForm)} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          Write a Review
        </button>
      </div>

      {/* Review Form */}
      {showReviewForm && (<div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (<button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                    <Star className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}/>
                  </button>))}
                <span className="text-sm text-gray-600 ml-2">{rating} stars</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Summarize your experience" maxLength={100}/>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Share your thoughts about this product..." maxLength={500}/>
            </div>
            
            <div className="flex space-x-3">
              <button type="submit" disabled={submitting} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setShowReviewForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>)}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (<div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">No reviews yet. Be the first to review this product!</p>
          </div>) : (reviews.map((review) => (<div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  {review.userPhoto ? (<img src={review.userPhoto} alt={review.userName} className="w-10 h-10 rounded-full object-cover"/>) : (<User className="w-5 h-5 text-purple-600"/>)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{review.userName}</h4>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                  <p className="text-gray-700 mb-3">{review.comment}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{formatDate(review.createdAt)}</span>
                    <button onClick={() => handleHelpful(review.id)} className="flex items-center space-x-1 hover:text-purple-600 transition-colors">
                      <ThumbsUp className="w-4 h-4"/>
                      <span>Helpful ({review.helpful})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>)))}
      </div>
    </div>);
}


