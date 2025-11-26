'use client';

import React, { useState } from 'react';
import { 
  Shield,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  TrendingUp,
  Users,
  AlertTriangle,
  Settings,
  Eye
} from 'lucide-react';
import { UserProfile } from '@/store/userProfileStore';
import { useUserBrands } from '@/hooks/useUserBrands';
import { toast } from 'sonner';

interface AdminControlsProps {
  profile: UserProfile;
  isAdmin: boolean;
  onApprove: (userId: string) => Promise<void>;
  onReject: (userId: string) => Promise<void>;
  onBan: (userId: string) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
}

export default function AdminControls({
  profile,
  isAdmin,
  onApprove,
  onReject,
  onBan,
  onDelete
}: AdminControlsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { brands } = useUserBrands(profile.id, 10);

  if (!isAdmin) return null;

  const handleAction = async (action: string, userId: string) => {
    setLoading(action);
    try {
      switch (action) {
        case 'approve':
          await onApprove(userId);
          toast.success('User approved successfully');
          break;
        case 'reject':
          await onReject(userId);
          toast.success('User rejected successfully');
          break;
        case 'ban':
          await onBan(userId);
          toast.success('User banned successfully');
          break;
        case 'delete':
          await onDelete(userId);
          toast.success('User deleted successfully');
          break;
      }
    } catch (error) {
      toast.error('Failed to perform action');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-yellow-800">Admin Controls</h3>
      </div>

      {/* Approval Status */}
      {profile.role === 'seller' || profile.role === 'company' ? (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium">Approval Status:</span>
            {profile.approved ? (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Approved</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Pending Approval</span>
              </div>
            )}
          </div>

          {!profile.approved && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleAction('approve', profile.id)}
                disabled={loading === 'approve'}
                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handleAction('reject', profile.id)}
                disabled={loading === 'reject'}
                className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* User Management */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Management</h4>
        <div className="flex space-x-2">
          <button
            onClick={() => handleAction('ban', profile.id)}
            disabled={loading === 'ban'}
            className="flex items-center space-x-1 bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 disabled:opacity-50"
          >
            <Ban className="w-4 h-4" />
            <span>Ban User</span>
          </button>
          <button
            onClick={() => handleAction('delete', profile.id)}
            disabled={loading === 'delete'}
            className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            <span>Delete User</span>
          </button>
        </div>
      </div>

    </div>
  );
}
