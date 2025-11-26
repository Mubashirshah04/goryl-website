import React from 'react';
import { useUserApplications } from '../../hooks/useUserApplications';
// Component to display user applications in the profile page
const ApplicationsTab = () => {
    const { applications, loading, error, getPendingApplications, getApprovedApplications, getRejectedApplications } = useUserApplications();
    if (loading) {
        return (<div className="applications-tab">
        <h2>My Applications</h2>
        <div className="loading">Loading applications...</div>
      </div>);
    }
    if (error) {
        return (<div className="applications-tab">
        <h2>My Applications</h2>
        <div className="error">Error: {error}</div>
      </div>);
    }
    const pendingApps = getPendingApplications();
    const approvedApps = getApprovedApplications();
    const rejectedApps = getRejectedApplications();
    const formatDate = (date) => {
        if (!date)
            return 'N/A';
        return new Date(date).toLocaleDateString();
    };
    const getAccountTypeLabel = (type) => {
        switch (type) {
            case 'personal_seller':
                return 'Personal Seller';
            case 'brand':
                return 'Brand Account';
            case 'company':
                return 'Company Account';
            default:
                return type;
        }
    };
    return (<div className="applications-tab">
      <h2>My Applications</h2>
      
      {applications.length === 0 ? (<div className="no-applications">
          <p>You haven't submitted any applications yet.</p>
        </div>) : (<div className="applications-content">
          {/* Pending Applications */}
          {pendingApps.length > 0 && (<div className="application-section">
              <h3>Pending Applications ({pendingApps.length})</h3>
              <div className="applications-grid">
                {pendingApps.map((app) => (<div key={app.id} className="application-card pending">
                    <div className="application-header">
                      <h4>{getAccountTypeLabel(app.requestedType)}</h4>
                      <span className="status-badge pending">Pending</span>
                    </div>
                    <div className="application-details">
                      {app.businessName && (<p><strong>Business Name:</strong> {app.businessName}</p>)}
                      <p><strong>Submitted:</strong> {formatDate(app.submittedAt)}</p>
                      {app.businessDescription && (<p><strong>Description:</strong> {app.businessDescription}</p>)}
                    </div>
                  </div>))}
              </div>
            </div>)}

          {/* Approved Applications */}
          {approvedApps.length > 0 && (<div className="application-section">
              <h3>Approved Applications ({approvedApps.length})</h3>
              <div className="applications-grid">
                {approvedApps.map((app) => (<div key={app.id} className="application-card approved">
                    <div className="application-header">
                      <h4>{getAccountTypeLabel(app.requestedType)}</h4>
                      <span className="status-badge approved">Approved</span>
                    </div>
                    <div className="application-details">
                      {app.businessName && (<p><strong>Business Name:</strong> {app.businessName}</p>)}
                      <p><strong>Submitted:</strong> {formatDate(app.submittedAt)}</p>
                      <p><strong>Approved:</strong> {formatDate(app.approvedAt)}</p>
                      {app.businessDescription && (<p><strong>Description:</strong> {app.businessDescription}</p>)}
                    </div>
                  </div>))}
              </div>
            </div>)}

          {/* Rejected Applications */}
          {rejectedApps.length > 0 && (<div className="application-section">
              <h3>Rejected Applications ({rejectedApps.length})</h3>
              <div className="applications-grid">
                {rejectedApps.map((app) => (<div key={app.id} className="application-card rejected">
                    <div className="application-header">
                      <h4>{getAccountTypeLabel(app.requestedType)}</h4>
                      <span className="status-badge rejected">Rejected</span>
                    </div>
                    <div className="application-details">
                      {app.businessName && (<p><strong>Business Name:</strong> {app.businessName}</p>)}
                      <p><strong>Submitted:</strong> {formatDate(app.submittedAt)}</p>
                      <p><strong>Rejected:</strong> {formatDate(app.reviewedAt)}</p>
                      {app.rejectionReason && (<p><strong>Reason:</strong> {app.rejectionReason}</p>)}
                      {app.businessDescription && (<p><strong>Description:</strong> {app.businessDescription}</p>)}
                    </div>
                  </div>))}
              </div>
            </div>)}
        </div>)}

      <style jsx>{`
        .applications-tab {
          padding: 20px;
        }
        
        .applications-tab h2 {
          margin-bottom: 20px;
          color: #333;
        }
        
        .loading, .error, .no-applications {
          text-align: center;
          padding: 40px;
          color: #666;
        }
        
        .error {
          color: #e74c3c;
        }
        
        .application-section {
          margin-bottom: 30px;
        }
        
        .application-section h3 {
          margin-bottom: 15px;
          color: #555;
        }
        
        .applications-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .application-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .application-card.pending {
          border-left: 4px solid #f39c12;
        }
        
        .application-card.approved {
          border-left: 4px solid #27ae60;
        }
        
        .application-card.rejected {
          border-left: 4px solid #e74c3c;
        }
        
        .application-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .application-header h4 {
          margin: 0;
          color: #333;
        }
        
        .status-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-badge.pending {
          background: #f39c12;
          color: white;
        }
        
        .status-badge.approved {
          background: #27ae60;
          color: white;
        }
        
        .status-badge.rejected {
          background: #e74c3c;
          color: white;
        }
        
        .application-details p {
          margin: 8px 0;
          color: #666;
        }
        
        .application-details strong {
          color: #333;
        }
      `}</style>
    </div>);
};
export default ApplicationsTab;
