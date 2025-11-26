'use client';
import React, { useState, useEffect } from 'react';
import { Settings, Save, Plus, Trash2, Edit, ToggleLeft, Tag, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { getSystemSettings, updateSystemSettings } from '@/lib/adminService';
export default function AdminSettingsPage() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('categories');
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingSubcategory, setEditingSubcategory] = useState(null);
    useEffect(() => {
        loadSettings();
    }, []);
    const loadSettings = async () => {
        try {
            const data = await getSystemSettings();
            setSettings(data);
        }
        catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Failed to load settings');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSaveSettings = async () => {
        if (!settings)
            return;
        setSaving(true);
        try {
            await updateSystemSettings(settings);
            toast.success('Settings saved successfully');
        }
        catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        }
        finally {
            setSaving(false);
        }
    };
    const handleFeatureToggle = (feature) => {
        if (!settings)
            return;
        setSettings(prev => prev ? Object.assign(Object.assign({}, prev), { features: Object.assign(Object.assign({}, prev.features), { [feature]: !prev.features[feature] }) }) : null);
    };
    const addCategory = () => {
        if (!settings)
            return;
        const newCategory = {
            id: `cat_${Date.now()}`,
            name: 'New Category',
            color: '#3B82F6',
            subcategories: []
        };
        setSettings(prev => prev ? Object.assign(Object.assign({}, prev), { categories: [...prev.categories, newCategory] }) : null);
        setEditingCategory(newCategory.id);
    };
    const updateCategory = (categoryId, field, value) => {
        if (!settings)
            return;
        setSettings(prev => prev ? Object.assign(Object.assign({}, prev), { categories: prev.categories.map(cat => cat.id === categoryId ? Object.assign(Object.assign({}, cat), { [field]: value }) : cat) }) : null);
    };
    const removeCategory = (categoryId) => {
        if (!settings)
            return;
        setSettings(prev => prev ? Object.assign(Object.assign({}, prev), { categories: prev.categories.filter(cat => cat.id !== categoryId) }) : null);
    };
    const addSubcategory = (categoryId) => {
        if (!settings)
            return;
        const newSubcategory = {
            id: `sub_${Date.now()}`,
            name: 'New Subcategory',
            color: '#6B7280'
        };
        setSettings(prev => prev ? Object.assign(Object.assign({}, prev), { categories: prev.categories.map(cat => cat.id === categoryId
                ? Object.assign(Object.assign({}, cat), { subcategories: [...cat.subcategories, newSubcategory] }) : cat) }) : null);
        setEditingSubcategory({ categoryId, subcategoryId: newSubcategory.id });
    };
    const updateSubcategory = (categoryId, subcategoryId, field, value) => {
        if (!settings)
            return;
        setSettings(prev => prev ? Object.assign(Object.assign({}, prev), { categories: prev.categories.map(cat => cat.id === categoryId
                ? Object.assign(Object.assign({}, cat), { subcategories: cat.subcategories.map(sub => sub.id === subcategoryId ? Object.assign(Object.assign({}, sub), { [field]: value }) : sub) }) : cat) }) : null);
    };
    const removeSubcategory = (categoryId, subcategoryId) => {
        if (!settings)
            return;
        setSettings(prev => prev ? Object.assign(Object.assign({}, prev), { categories: prev.categories.map(cat => cat.id === categoryId
                ? Object.assign(Object.assign({}, cat), { subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId) }) : cat) }) : null);
    };
    const tabs = [
        { id: 'categories', label: 'Categories', icon: Tag },
        { id: 'features', label: 'Features', icon: ToggleLeft },
        { id: 'general', label: 'General', icon: Settings }
    ];
    if (loading) {
        return (<AdminLayout title="System Settings" subtitle="Configure platform settings">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>);
    }
    if (!settings) {
        return (<AdminLayout title="System Settings" subtitle="Configure platform settings">
        <div className="text-center text-red-600">
          Failed to load settings
        </div>
      </AdminLayout>);
    }
    return (<AdminLayout title="System Settings" subtitle="Configure platform settings and features" actions={<button onClick={handleSaveSettings} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
          {saving ? (<div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>) : (<div className="flex items-center">
              <Save className="w-4 h-4 mr-2"/>
              Save Settings
            </div>)}
        </button>}>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
            const Icon = tab.icon;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <Icon className="w-4 h-4 mr-2"/>
                    {tab.label}
                  </button>);
        })}
            </nav>
          </div>

          <div className="p-6">
            {/* Categories Tab */}
            {activeTab === 'categories' && (<div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Categories & Subcategories</h3>
                  <button onClick={addCategory} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2 inline"/>
                    Add Category
                  </button>
                </div>

                <div className="space-y-4">
                  {settings.categories.map((category) => (<div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: category.color }}/>
                          {editingCategory === category.id ? (<input type="text" value={category.name} onChange={(e) => updateCategory(category.id, 'name', e.target.value)} className="text-lg font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 text-black" onBlur={() => setEditingCategory(null)} onKeyPress={(e) => e.key === 'Enter' && setEditingCategory(null)} autoFocus/>) : (<h4 className="text-lg font-medium text-gray-900 dark:text-white">{category.name}</h4>)}
                          <button onClick={() => setEditingCategory(category.id)} className="text-gray-400 hover:text-gray-600">
                            <Edit className="w-4 h-4"/>
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => addSubcategory(category.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                            <Plus className="w-3 h-3 mr-1 inline"/>
                            Add Sub
                          </button>
                          <button onClick={() => removeCategory(category.id)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>

                      <div className="ml-6 space-y-2">
                        {category.subcategories.map((subcategory) => (<div key={subcategory.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 rounded" style={{ backgroundColor: subcategory.color }}/>
                              {(editingSubcategory === null || editingSubcategory === void 0 ? void 0 : editingSubcategory.categoryId) === category.id && (editingSubcategory === null || editingSubcategory === void 0 ? void 0 : editingSubcategory.subcategoryId) === subcategory.id ? (<input type="text" value={subcategory.name} onChange={(e) => updateSubcategory(category.id, subcategory.id, 'name', e.target.value)} className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 text-black" onBlur={() => setEditingSubcategory(null)} onKeyPress={(e) => e.key === 'Enter' && setEditingSubcategory(null)} autoFocus/>) : (<span className="text-sm text-gray-700">{subcategory.name}</span>)}
                              <button onClick={() => setEditingSubcategory({ categoryId: category.id, subcategoryId: subcategory.id })} className="text-gray-400 hover:text-gray-600">
                                <Edit className="w-3 h-3"/>
                              </button>
                            </div>
                            <button onClick={() => removeSubcategory(category.id, subcategory.id)} className="text-red-600 hover:text-red-800">
                              <Trash2 className="w-3 h-3"/>
                            </button>
                          </div>))}
                        {category.subcategories.length === 0 && (<p className="text-sm text-gray-500 italic">No subcategories</p>)}
                      </div>
                    </div>))}
                </div>
              </div>)}

            {/* Features Tab */}
            {activeTab === 'features' && (<div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Platform Features</h3>
                
                <div className="space-y-4">
                  {Object.entries(settings.features).map(([feature, enabled]) => (<div key={feature} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {enabled ? (<CheckCircle className="w-5 h-5 text-green-600"/>) : (<X className="w-5 h-5 text-red-600"/>)}
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">{feature}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            {feature === 'reels' && 'Enable video reels feature'}
                            {feature === 'chat' && 'Enable real-time chat between users'}
                            {feature === 'reviews' && 'Enable product reviews and ratings'}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleFeatureToggle(feature)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
                      </button>
                    </div>))}
                </div>
              </div>)}

            {/* General Tab */}
            {activeTab === 'general' && (<div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">General Settings</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Platform Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                        <input type="text" value={settings.platformName || 'Zaillisy'} onChange={(e) => setSettings(prev => prev ? {...prev, platformName: e.target.value} : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black" placeholder="Platform name"/>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                        <input type="email" value={settings.supportEmail || 'support@goryl.com'} onChange={(e) => setSettings(prev => prev ? {...prev, supportEmail: e.target.value} : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black" placeholder="support@example.com"/>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Security Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Admin Protection</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Require admin authentication for sensitive operations</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">ENV</span>
                          <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-green-600"/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </AdminLayout>);
}
