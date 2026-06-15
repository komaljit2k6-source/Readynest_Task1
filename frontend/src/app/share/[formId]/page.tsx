'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { FormField } from '@/types';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface PublicForm {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  settings: {
    theme: string;
    primaryColor: string;
    backgroundColor: string;
    buttonText: string;
  };
}

export default function SharePage() {
  const { formId } = useParams() as { formId: string };
  const [form, setForm] = useState<PublicForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicForm = async () => {
      try {
        const data = await api.forms.getPublic(formId);
        setForm(data);
        
        // Initialize answer state
        const initialAnswers: Record<string, any> = {};
        data.fields.forEach((field: FormField) => {
          if (field.type === 'checkbox') {
            initialAnswers[field.id] = [];
          } else {
            initialAnswers[field.id] = '';
          }
        });
        setAnswers(initialAnswers);
      } catch (err: any) {
        setError(err.message || 'Failed to load form. Make sure the form exists and is published.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicForm();
  }, [formId]);

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear validation error when typing
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const currentSelections = (answers[fieldId] as string[]) || [];
    let updatedSelections: string[];
    
    if (checked) {
      updatedSelections = [...currentSelections, option];
    } else {
      updatedSelections = currentSelections.filter(item => item !== option);
    }
    
    handleInputChange(fieldId, updatedSelections);
  };

  const validateForm = (): boolean => {
    if (!form) return false;
    const errors: Record<string, string> = {};

    form.fields.forEach(field => {
      const val = answers[field.id];
      
      // Check required
      if (field.required && (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0))) {
        errors[field.id] = `${field.label} is required`;
        return;
      }

      // Check non-empty field-specific constraints
      if (val) {
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            errors[field.id] = 'Enter a valid email address';
          }
        } else if (field.type === 'number') {
          if (isNaN(Number(val))) {
            errors[field.id] = 'Value must be a valid number';
          }
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || submitting) return;

    setError('');
    const isValid = validateForm();
    if (!isValid) return;

    setSubmitting(true);
    try {
      await api.responses.submit(formId, answers);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Loading Form...</p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <div className="inline-flex bg-red-50 p-3 rounded-full text-red-500">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Form Unavailable</h3>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const isDark = form.settings.theme === 'dark';

  return (
    <div 
      className={`min-h-screen flex flex-col items-center py-12 px-4 transition ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Form Logo */}
        <div className="flex items-center justify-center gap-1.5 opacity-60">
          <FileText size={18} className="text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wider">FormForge Submissions</span>
        </div>

        {submitted ? (
          /* Submission Completed success view */
          <div 
            className={`border rounded-2xl p-10 text-center space-y-5 shadow-sm transition ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="inline-flex bg-emerald-500/10 p-4 rounded-full text-emerald-500">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black">Thank You!</h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm max-w-sm mx-auto`}>
              Your response has been recorded successfully.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                const resetAnswers: Record<string, any> = {};
                form.fields.forEach(field => {
                  resetAnswers[field.id] = field.type === 'checkbox' ? [] : '';
                });
                setAnswers(resetAnswers);
              }}
              className="text-xs font-semibold px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition"
            >
              Submit another response
            </button>
          </div>
        ) : (
          /* Form Content Page */
          <form 
            onSubmit={handleSubmit}
            className={`border rounded-2xl overflow-hidden shadow-sm transition ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {/* Theme accent header line */}
            <div className="h-2.5" style={{ backgroundColor: form.settings.primaryColor }} />

            {/* Header */}
            <div className={`p-8 border-b transition ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h1 className="text-3xl font-black tracking-tight">{form.title}</h1>
              {form.description && (
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>
                  {form.description}
                </p>
              )}
            </div>

            {/* Submit Failure Banner */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-8 mt-6 rounded-r-lg flex items-center gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                <span className="text-sm text-red-800 font-medium">{error}</span>
              </div>
            )}

            {/* Fields list */}
            <div className="p-8 space-y-6">
              {form.fields.map((field) => {
                const hasError = !!validationErrors[field.id];
                const inputVal = answers[field.id];

                return (
                  <div key={field.id} className="space-y-1.5">
                    {/* Label */}
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-bold">{field.label}</label>
                      {field.required && <span className="text-red-500 font-bold">*</span>}
                    </div>

                    {/* Inputs based on type */}
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={inputVal || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 focus:ring-1 focus:ring-indigo-500 text-slate-100' 
                            : 'bg-white border-slate-200 focus:ring-1 focus:ring-indigo-500 text-slate-900'
                        } ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        value={inputVal || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition resize-none ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 focus:ring-1 focus:ring-indigo-500 text-slate-100' 
                            : 'bg-white border-slate-200 focus:ring-1 focus:ring-indigo-500 text-slate-900'
                        } ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    )}

                    {field.type === 'email' && (
                      <input
                        type="email"
                        value={inputVal || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 focus:ring-1 focus:ring-indigo-500 text-slate-100' 
                            : 'bg-white border-slate-200 focus:ring-1 focus:ring-indigo-500 text-slate-900'
                        } ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={inputVal || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 focus:ring-1 focus:ring-indigo-500 text-slate-100' 
                            : 'bg-white border-slate-200 focus:ring-1 focus:ring-indigo-500 text-slate-900'
                        } ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    )}

                    {field.type === 'date' && (
                      <input
                        type="date"
                        value={inputVal || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 focus:ring-1 focus:ring-indigo-500 text-slate-150' 
                            : 'bg-white border-slate-200 focus:ring-1 focus:ring-indigo-500 text-slate-800'
                        } ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        value={inputVal || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none transition bg-white ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 focus:ring-1 focus:ring-indigo-500 text-slate-100' 
                            : 'bg-white border-slate-200 focus:ring-1 focus:ring-indigo-500 text-slate-900'
                        } ${hasError ? 'border-red-500 focus:ring-red-500' : ''}`}
                      >
                        <option value="">{field.placeholder || 'Select an option...'}</option>
                        {field.options.map((opt, idx) => (
                          <option key={idx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'radio' && (
                      <div className="space-y-2.5 pt-1.5">
                        {field.options.map((opt, idx) => (
                          <label key={idx} className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              checked={inputVal === opt}
                              onChange={() => handleInputChange(field.id, opt)}
                              className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
                            />
                            <span className="text-sm font-medium">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="space-y-2.5 pt-1.5">
                        {field.options.map((opt, idx) => {
                          const isChecked = ((inputVal as string[]) || []).includes(opt);
                          return (
                            <label key={idx} className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                                className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-350 rounded"
                              />
                              <span className="text-sm font-medium">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Field Validation Error message */}
                    {hasError && (
                      <span className="text-xs font-semibold text-red-500 block pl-0.5">
                        {validationErrors[field.id]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form Footer */}
            <div className={`p-8 border-t flex justify-end transition ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center px-6 py-2.5 text-white font-bold rounded-lg shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                style={{ backgroundColor: form.settings.primaryColor }}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  form.settings.buttonText
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
