import { useState, useEffect } from 'react';
import { getCurrentUser } from '../lib/auth';
import { marketplaceService } from '../lib';
// Hook to fetch and manage user applications
export const useUserApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            setLoading(false);
            return;
        }
        const unsubscribe = marketplaceService.subscribeToMyApplications((apps) => {
            setApplications(apps);
            setLoading(false);
            setError(null);
        });
        return () => unsubscribe();
    }, []);
    // Function to submit a new application
    const submitApplication = async (applicationData) => {
        try {
            setError(null);
            const applicationId = await marketplaceService.submitSellerApplication(applicationData);
            return applicationId;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to submit application';
            setError(errorMessage);
            throw err;
        }
    };
    // Function to get application by ID
    const getApplicationById = (applicationId) => {
        return applications.find(app => app.id === applicationId);
    };
    // Function to get applications by status
    const getApplicationsByStatus = (status) => {
        return applications.filter(app => app.status === status);
    };
    // Function to get pending applications
    const getPendingApplications = () => {
        return getApplicationsByStatus('pending');
    };
    // Function to get approved applications
    const getApprovedApplications = () => {
        return getApplicationsByStatus('approved');
    };
    // Function to get rejected applications
    const getRejectedApplications = () => {
        return getApplicationsByStatus('rejected');
    };
    return {
        applications,
        loading,
        error,
        submitApplication,
        getApplicationById,
        getPendingApplications,
        getApprovedApplications,
        getRejectedApplications
    };
};
