'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Form } from '@/types';
import { Navbar } from '@/components/Navbar';
import { 
  Plus, Search, Edit3, Trash2, Copy, BarChart3, 
  ExternalLink, Check, AlertCircle, FileText, LayoutList 
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchForms = async () => {
    try {
      const data = await api.forms.getAll();
      setForms(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchForms();
    }
  }, [user, authLoading]);

  const handleCreateForm = async () => {
    setCreating(true);
    setError('');
    try {
      const defaultForm = {
        title: 'Untitled Form',
        description: 'Provide a description for your form here.',
        fields: [
          {
            id: `field_${Date.now()}`,
            type: 'text',
            label: 'Name',
            placeholder: 'Enter your name',
            required: true,
            options: [],
          }
        ],
        settings: {
          theme: 'light',
          primaryColor: '#4f46e5', // Indigo-600
          backgroundColor: '#ffffff',
          buttonText: 'Submit Responses',
        },
        isPublished: false,
      };
      
      const newForm = await api.forms.create(defaultForm);
      router.push(`/builder/${newForm._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create form');
      setCreating(false);
    }
  };

  const handleDuplicate = async (formId: string) => {
    try {
      const newForm = await api.forms.duplicate(formId);
      setForms([newForm, ...forms]);
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate form');
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form and all its responses? This cannot be undone.')) {
      return;
    }
    
    try {
      await api.forms.delete(formId);
      setForms(forms.filter(f => f._id !== formId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete form');
    }
  };

  const copyShareLink = (formId: string) => {
    const shareUrl = `${window.location.origin}/share/${formId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(formId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredForms = forms.filter(f => 
    f.title.toLowerCase().includes(search.toLowerCase()) || 
    f.description.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
            <span className="text-sm text-red-700 font-medium">{error}</span>
          </div>
        )}

        {/* Dashboard Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Forms</h1>
            <p className="text-slate-500 text-sm">Create, share, and view submissions for your forms</p>
          </div>

          <button
            onClick={handleCreateForm}
            disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition duration-150 disabled:opacity-50"
          >
            {creating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Plus size={18} />
                <span>Create Form</span>
              </>
            )}
          </button>
        </div>

        {/* Search & Statistics summary */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm max-w-md">
          <Search size={18} className="text-slate-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search forms by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm focus:outline-none bg-transparent text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Forms Grid */}
        {filteredForms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form) => {
              const conversion = form.viewsCount > 0 
                ? Math.round((form.submissionCount / form.viewsCount) * 100) 
                : 0;

              return (
                <div key={form._id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition duration-200 group">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition truncate" title={form.title}>
                        {form.title}
                      </h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        form.isPublished 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {form.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <p className="text-slate-500 text-sm line-clamp-2 mb-6 min-h-[2.5rem]">
                      {form.description || 'No description provided.'}
                    </p>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 mb-6 text-center border border-slate-100">
                      <div>
                        <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Views</span>
                        <span className="text-base font-bold text-slate-800">{form.viewsCount}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Replies</span>
                        <span className="text-base font-bold text-slate-800">{form.submissionCount}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Conv.</span>
                        <span className="text-base font-bold text-slate-800">{conversion}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    {/* Left Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => router.push(`/builder/${form._id}`)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Form"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/responses/${form._id}`)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title="Responses & Analytics"
                      >
                        <BarChart3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(form._id)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title="Duplicate Form"
                      >
                        <Copy size={16} />
                      </button>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1.5">
                      {form.isPublished && (
                        <>
                          <button
                            onClick={() => copyShareLink(form._id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition"
                          >
                            {copiedId === form._id ? (
                              <>
                                <Check size={12} />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <ExternalLink size={12} />
                                <span>Share</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(form._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Form"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-white border border-dashed border-slate-350 rounded-2xl max-w-2xl mx-auto px-6 space-y-4">
            <div className="inline-flex bg-indigo-50 p-4 rounded-full text-indigo-500">
              <LayoutList size={36} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No forms yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto text-sm">
              Create your very first customizable dynamic form by clicking the "Create Form" button.
            </p>
            <button
              onClick={handleCreateForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/10 transition"
            >
              <Plus size={18} />
              <span>Create My First Form</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
