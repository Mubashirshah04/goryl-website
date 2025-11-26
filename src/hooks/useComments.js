// ✅ AWS DYNAMODB - Firestore completely removed
// useComments hook .js - AWS stubs

import { useState, useEffect } from 'react';

export const useComments = (productId) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            return;
        }

        const fetchComments = async () => {
            try {
                // TODO: Fetch comments from AWS DynamoDB
                console.warn('⚠️ useComments (.js): AWS implementation pending');
                setComments([]);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching comments:', error);
                setLoading(false);
            }
        };

        fetchComments();
    }, [productId]);

    const addComment = async (commentText, userId) => {
        try {
            // TODO: Add comment to AWS DynamoDB
            console.warn('⚠️ addComment (.js): AWS implementation pending');
        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    };

    return { comments, loading, addComment };
};
