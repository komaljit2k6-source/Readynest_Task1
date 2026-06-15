'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Form, FormAnalytics, FormResponse } from '@/types';
import { Navbar } from '@/components/Navbar';
import { 
  ArrowLeft, Download, BarChart3, Database, Eye, CheckSquare, 
  ChevronRight, Calendar, Info, HelpCircle 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';

export default function ResponsesPage() {
  const { formId } = useParams() as { formId: string };
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [form, setForm] = useState<Form | null>(null);
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'submissions'>('analytics');
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');

  // Recharts hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      const formDetails = await api.forms.getPrivate(formId);
      const analyticsData = await api.responses.getAnalytics(formId);
      const responsesList = await api.responses.getAll(formId);
      
      setForm(formDetails);
      setAnalytics(analyticsData);
      setResponses(responsesList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch form responses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [formId, user, authLoading]);

  const handleExportCSV = async () => {
    try {
      await api.responses.exportCSV(formId);
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Loading analytics...</p>
      </div>
    );
  }

  if (error || !form || !analytics) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="inline-flex bg-red-50 p-3 rounded-full text-red-500">
            <Info size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Analytics Unavailable</h3>
          <p className="text-slate-500 text-sm">{error || 'Could not fetch analytics data'}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Predefined chart colors
  const CHART_COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{form.title}</h1>
              <p className="text-slate-500 text-sm">Response dashboard & performance analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              disabled={responses.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm w-full sm:w-auto transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm max-w-md">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'analytics' 
                ? 'bg-indigo-50 text-indigo-750' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 size={16} />
            <span>Overview & Charts</span>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${
              activeTab === 'submissions' 
                ? 'bg-indigo-50 text-indigo-755' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Database size={16} />
            <span>Individual Answers ({responses.length})</span>
          </button>
        </div>

        {/* Summary Metric Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
            <div className="bg-indigo-50 text-indigo-650 p-4 rounded-xl">
              <Eye size={24} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Views</span>
              <span className="text-3xl font-black text-slate-900">{analytics.views}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
            <div className="bg-indigo-50 text-indigo-650 p-4 rounded-xl">
              <CheckSquare size={24} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Submissions</span>
              <span className="text-3xl font-black text-slate-900">{analytics.submissions}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
            <div className="bg-indigo-50 text-indigo-650 p-4 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Submission Rate</span>
              <span className="text-3xl font-black text-slate-900">{analytics.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Tab Content: Analytics overview */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Timeline LineChart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" />
                <span>Submissions Over Time</span>
              </h3>
              
              <div className="h-72 w-full">
                {mounted && analytics.submissionTimeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.submissionTimeline}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="submissions" 
                        stroke="#4f46e5" 
                        strokeWidth={3} 
                        dot={{ r: 4, stroke: '#4f46e5', strokeWidth: 2, fill: '#fff' }}
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    No submissions recorded yet to plot timeline data.
                  </div>
                )}
              </div>
            </div>

            {/* Questions Choice Frequency Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(analytics.fieldAnalytics).map((fieldId, index) => {
                const fieldData = analytics.fieldAnalytics[fieldId];
                const chartData = Object.keys(fieldData.summary).map(option => ({
                  name: option,
                  count: fieldData.summary[option],
                }));

                const totalResponses = chartData.reduce((acc, curr) => acc + curr.count, 0);

                return (
                  <div key={fieldId} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h4 className="font-bold text-slate-800 text-base mb-1 flex items-start gap-1.5 leading-snug">
                      <HelpCircle size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{fieldData.label}</span>
                    </h4>
                    <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-4 block">
                      {fieldData.type} field • {totalResponses} answer counts
                    </span>

                    <div className="h-56 w-full mt-auto">
                      {mounted && totalResponses > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={80} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                          No option responses recorded for this question yet.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content: Submissions Grid */}
        {activeTab === 'submissions' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {responses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-55/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Submission Date</th>
                      {form.fields.map(field => (
                        <th key={field.id} className="px-6 py-4">{field.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                    {responses.map((resp) => (
                      <tr key={resp._id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
                          {new Date(resp.createdAt).toLocaleString()}
                        </td>
                        {form.fields.map(field => {
                          const val = resp.answers[field.id];
                          let renderedVal = '';

                          if (val === undefined || val === null) {
                            renderedVal = '-';
                          } else if (Array.isArray(val)) {
                            renderedVal = val.join(', ');
                          } else {
                            renderedVal = String(val);
                          }

                          return (
                            <td key={field.id} className="px-6 py-4 truncate max-w-[200px]" title={renderedVal}>
                              {renderedVal}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 px-6 space-y-3">
                <div className="inline-flex bg-slate-50 p-4 rounded-full text-slate-405">
                  <Database size={32} />
                </div>
                <h4 className="font-bold text-slate-900 text-lg">No submissions yet</h4>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  Once users open your public form and send responses, their details will display right here.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
