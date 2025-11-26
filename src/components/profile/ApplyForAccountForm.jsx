import React, { useState } from 'react';
import { useUserApplications } from '../../hooks/useUserApplications';
// Form component for applying for different account types
const ApplyForAccountForm = () => {
    const { submitApplication, error } = useUserApplications();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        requestedType: 'personal_seller',
        businessName: '',
        businessDescription: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        }
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            // Handle nested address fields
            const [parent, child] = name.split('.');
            setFormData(prev => (Object.assign(Object.assign({}, prev), { [parent]: Object.assign(Object.assign({}, prev[parent]), { [child]: value }) })));
        }
        else {
            setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            await submitApplication(formData);
            // Reset form after successful submission
            setFormData({
                requestedType: 'personal_seller',
                businessName: '',
                businessDescription: '',
                phone: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: ''
                }
            });
            toast.success('Application submitted successfully!');
        }
        catch (err) {
            console.error('Error submitting application:', err);
            toast.error('Failed to submit application. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const getAccountTypeDescription = (type) => {
        switch (type) {
            case 'personal_seller':
                return 'For individual sellers and creators';
            case 'brand':
                return 'For established brands and retailers';
            case 'company':
                return 'For businesses with multiple brands';
            default:
                return '';
        }
    };
    return (<div className="apply-for-account-form">
      <h2>Apply for Seller Account</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="requestedType">Account Type *</label>
          <select id="requestedType" name="requestedType" value={formData.requestedType} onChange={handleChange} required>
            <option value="personal_seller">Personal Seller</option>
            <option value="brand">Brand Account</option>
            <option value="company">Company Account</option>
          </select>
          <p className="help-text">{getAccountTypeDescription(formData.requestedType)}</p>
        </div>
        
        <div className="form-group">
          <label htmlFor="businessName">
            {formData.requestedType === 'personal_seller' ? 'Name' : 'Business Name'} *
          </label>
          <input type="text" id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} required/>
        </div>
        
        <div className="form-group">
          <label htmlFor="businessDescription">Business Description *</label>
          <textarea id="businessDescription" name="businessDescription" value={formData.businessDescription} onChange={handleChange} required rows={4}/>
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required/>
        </div>
        
        <h3>Business Address</h3>
        
        <div className="form-group">
          <label htmlFor="address.street">Street Address *</label>
          <input type="text" id="address.street" name="address.street" value={formData.address.street} onChange={handleChange} required/>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="address.city">City *</label>
            <input type="text" id="address.city" name="address.city" value={formData.address.city} onChange={handleChange} required/>
          </div>
          
          <div className="form-group">
            <label htmlFor="address.state">State/Province *</label>
            <input type="text" id="address.state" name="address.state" value={formData.address.state} onChange={handleChange} required/>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="address.zipCode">ZIP/Postal Code *</label>
            <input type="text" id="address.zipCode" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} required/>
          </div>
          
          <div className="form-group">
            <label htmlFor="address.country">Country *</label>
            <input type="text" id="address.country" name="address.country" value={formData.address.country} onChange={handleChange} required/>
          </div>
        </div>
        
        {error && (<div className="error-message">
            Error: {error}
          </div>)}
        
        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
      
      <style jsx>{`
        .apply-for-account-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .apply-for-account-form h2 {
          text-align: center;
          margin-bottom: 30px;
          color: #333;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-row {
          display: flex;
          gap: 15px;
        }
        
        .form-row .form-group {
          flex: 1;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #555;
        }
        
        .help-text {
          font-size: 14px;
          color: #777;
          margin-top: 5px;
          font-style: italic;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          font-family: inherit;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
        
        textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        h3 {
          margin: 30px 0 20px 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
          color: #333;
        }
        
        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .submit-button {
          width: 100%;
          padding: 15px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        
        .submit-button:hover:not(:disabled) {
          background: #2980b9;
        }
        
        .submit-button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 0;
          }
        }
      `}</style>
    </div>);
};
export default ApplyForAccountForm;
