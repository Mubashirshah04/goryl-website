'use client';
import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from '@/lib/firebaseAuth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Shield, Eye, EyeOff } from 'lucide-react';
export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();
    const router = useRouter();
    // STRICT: Only allow admin users to see login page
    if (user && user.role === 'admin') {
        router.push('/admin');
        return null;
    }
    
    // If user is logged in but not admin, redirect to home
    if (user && user.role !== 'admin') {
        router.push('/');
        return null;
    }
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            // STRICT: Only admin role allowed - no error messages
            if (user.role !== 'admin') {
                // Don't show any error message, just redirect silently
                router.push('/');
                return;
            }
            toast.success('Admin login successful');
            router.push('/admin');
        }
        catch (error) {
            console.error('Admin login error:', error);
            toast.error(error.message || 'Login failed');
        }
        finally {
            setLoading(false);
        }
    };
    // STRICT: Don't show login form to non-admin users
    // Redirect to home page immediately
    if (typeof window !== 'undefined') {
        router.push('/');
    }
    
    // Show nothing - completely blank
    return null;
}
