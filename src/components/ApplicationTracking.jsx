'use client';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText, Calendar } from 'lucide-react';
export default function ApplicationTracking({ userId }) {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [indexBuilding, setIndexBuilding] = useState(false);
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        console.log('🔍 Fetching applications for userId:', userId);
        // Track applications from both collections
        let applicationsFromApps = [];
        let applicationsFromSellerApps = [];
        let appsCollectionDone = false;
        let sellerAppsCollectionDone = false;
        // Function to combine and deduplicate applications
        const combineApplications = () => {
            if (appsCollectionDone && sellerAppsCollectionDone) {
                console.log('🔍 Combining applications from both collections');
                console.log(`📊 Apps collection: ${applicationsFromApps.length} applications`);
                console.log(`📊 SellerApps collection: ${applicationsFromSellerApps.length} applications`);
                // Combine applications from both collections
                const allApplications = [...applicationsFromApps, ...applicationsFromSellerApps];
                // Deduplicate by ID (in case same application exists in both collections)
                const uniqueApplications = allApplications.filter((app, index, self) => index === self.findIndex(a => a.id === app.id));
                console.log(`📊 Total unique applications: ${uniqueApplications.length}`);
                setApplications(uniqueApplications);
                setLoading(false);
            }
        };
        // Listen to 'sellerApplications' collection
        const q1 = query(collection(db, 'sellerApplications'), where('userId', '==', userId), orderBy('submittedAt', 'desc'));
        const unsubscribe1 = onSnapshot(q1, (snapshot) => {
            console.log('📊 Seller applications snapshot:', snapshot.docs.length, 'documents');
            applicationsFromSellerApps = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log('📄 Seller application data:', data);
                return Object.assign({ id: doc.id }, data);
            });
            sellerAppsCollectionDone = true;
            combineApplications();
        }, (error) => {
            console.error('❌ Error fetching seller applications:', error);
            // Handle index building state
            if (error.code === 'failed-precondition') {
                console.warn('⚠️ Index is still building. This is normal during initial setup.');
                setIndexBuilding(true);
            }
            sellerAppsCollectionDone = true;
            combineApplications();
        });
        // Listen to 'applications' collection
        const q2 = query(collection(db, 'applications'), where('userId', '==', userId), orderBy('submittedAt', 'desc'));
        const unsubscribe2 = onSnapshot(q2, (snapshot) => {
            console.log('📊 Applications snapshot:', snapshot.docs.length, 'documents');
            applicationsFromApps = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log('📄 Application data:', data);
                return Object.assign({ id: doc.id }, data);
            });
            appsCollectionDone = true;
            combineApplications();
        }, (error) => {
            console.error('❌ Error fetching applications:', error);
            // Handle index building state
            if (error.code === 'failed-precondition') {
                console.warn('⚠️ Index is still building. This is normal during initial setup.');
                setIndexBuilding(true);
            }
            appsCollectionDone = true;
            combineApplications();
        });
        return () => {
            unsubscribe1();
            unsubscribe2();
        };
    }, [userId]);
    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-5 h-5 text-green-500"/>;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-500"/>;
            case 'under_review':
                return <AlertCircle className="w-5 h-5 text-yellow-500"/>;
            default:
                return <Clock className="w-5 h-5 text-blue-500"/>;
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            case 'under_review':
                return 'Under Review';
            default:
                return 'Pending';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'under_review':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };
    const formatDate = (timestamp) => {
        if (!timestamp)
            return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (loading) {
        return (<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>);
    }
    if (applications.length === 0) {
        return (<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          {indexBuilding ? (<>
              <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4"/>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Index Building in Progress</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The system is currently setting up. This may take a few minutes.
                Please refresh the page in a few minutes to see your applications.
              </p>
            </>) : (<>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You haven't submitted any seller applications yet.
              </p>
              <Link href="/become-seller" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Apply to Become a Seller
              </Link>
            </>)}
        </div>
      </div>);
    }
    return (<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seller Applications</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{applications.length} application{applications.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {applications.map((app) => (<div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(app.status)}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{app.businessName}</h4>
                  <p className="text-sm text-gray-600 capitalize">{app.businessType} Account</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                {getStatusText(app.status)}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {app.businessDescription}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4"/>
                  <span>Submitted: {formatDate(app.submittedAt)}</span>
                </div>
                {app.documents && (<div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4"/>
                    <span>{app.documents.length} document{app.documents.length !== 1 ? 's' : ''}</span>
                  </div>)}
              </div>
            </div>

            {app.notes && app.notes.length > 0 && (<div className="mt-3 pt-3 border-t border-gray-100">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Admin Notes:</h5>
                <div className="space-y-1">
                  {app.notes.map((note, index) => (<p key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {note}
                    </p>))}
                </div>
              </div>)}
          </div>))}
      </div>
    </div>);
}
