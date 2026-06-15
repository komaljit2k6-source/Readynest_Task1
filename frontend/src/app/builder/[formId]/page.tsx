'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Form, FormField, FieldType, FormSettings } from '@/types';
import { Navbar } from '@/components/Navbar';
import { 
  ArrowLeft, Save, Eye, Plus, Trash2, ArrowUp, ArrowDown, 
  Settings, CheckSquare, AlignLeft, Mail, Hash, List, 
  Radio as RadioIcon, Calendar, Type, FileText, Check, AlertCircle 
} from 'lucide-react';

const FIELD_TYPES: { type: FieldType; label: string; icon: any }[] = [
  { type: 'text', label: 'Short Text', icon: Type },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'select', label: 'Dropdown Select', icon: List },
  { type: 'radio', label: 'Single Choice (Radio)', icon: RadioIcon },
  { type: 'checkbox', label: 'Multiple Choice (Checkbox)', icon: CheckSquare },
  { type: 'date', label: 'Date Pick', icon: Calendar },
];

export default function BuilderPage() {
  const { formId } = useParams() as { formId: string };
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [settings, setSettings] = useState<FormSettings>({
    theme: 'light',
    primaryColor: '#4f46e5',
    backgroundColor: '#ffffff',
    buttonText: 'Submit',
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'configure' | 'settings'>('add');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFormDetails = async () => {
      try {
        const data = await api.forms.getPrivate(formId);
        setForm(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setFields(data.fields || []);
        setSettings(data.settings || {
          theme: 'light',
          primaryColor: '#4f46e5',
          backgroundColor: '#ffffff',
          buttonText: 'Submit',
        });
        setIsPublished(data.isPublished || false);
        
        if (data.fields && data.fields.length > 0) {
          setSelectedFieldId(data.fields[0].id);
          setActiveTab('configure');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load form details');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchFormDetails();
    }
  }, [formId, user, authLoading]);

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: type === 'select' || type === 'radio' || type === 'checkbox' ? '' : 'Enter placeholder...',
      required: false,
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Option 1', 'Option 2'] : [],
    };
    
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
    setActiveTab('configure');
  };

  const handleUpdateField = (fieldId: string, updatedField: Partial<FormField>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updatedField } as FormField : f));
  };

  const handleDeleteField = (fieldId: string) => {
    const remainingFields = fields.filter(f => f.id !== fieldId);
    setFields(remainingFields);
    if (selectedFieldId === fieldId) {
      if (remainingFields.length > 0) {
        setSelectedFieldId(remainingFields[0].id);
      } else {
        setSelectedFieldId(null);
        setActiveTab('add');
      }
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reorderedFields = [...fields];
    const temp = reorderedFields[index];
    reorderedFields[index] = reorderedFields[newIndex];
    reorderedFields[newIndex] = temp;
    
    setFields(reorderedFields);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError('');

    try {
      const payload = {
        title,
        description,
        fields,
        settings,
        isPublished,
      };
      
      const updatedForm = await api.forms.update(formId, payload);
      setForm(updatedForm);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  // Choice Options Helpers
  const handleAddOption = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    const newOptions = [...field.options, `Option ${field.options.length + 1}`];
    handleUpdateField(fieldId, { options: newOptions });
  };

  const handleUpdateOption = (fieldId: string, optIndex: number, newValue: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    const newOptions = [...field.options];
    newOptions[optIndex] = newValue;
    handleUpdateField(fieldId, { options: newOptions });
  };

  const handleDeleteOption = (fieldId: string, optIndex: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    const newOptions = field.options.filter((_, idx) => idx !== optIndex);
    handleUpdateField(fieldId, { options: newOptions });
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium text-sm">Loading Form Builder...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Top Builder Control Header */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 flex justify-between items-center shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Go to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="space-y-0.5">
            <h1 className="font-bold text-slate-900 text-base leading-tight max-w-[200px] sm:max-w-md truncate">
              {title || 'Untitled Form'}
            </h1>
            <p className="text-slate-400 text-xs">Form Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Published switch */}
          <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
            <button
              onClick={() => setIsPublished(!isPublished)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPublished ? 'bg-emerald-500' : 'bg-slate-350'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isPublished ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold ${isPublished ? 'text-emerald-600' : 'text-slate-500'}`}>
              {isPublished ? 'Live' : 'Draft'}
            </span>
          </div>

          {isPublished && (
            <a
              href={`/share/${formId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:border-slate-400 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
            >
              <Eye size={15} />
              <span className="hidden sm:inline">View Live</span>
            </a>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm hover:shadow transition disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : saveSuccess ? (
              <>
                <Check size={16} />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left canvas column (form preview) */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-100">
          <div className="max-w-2xl w-full flex flex-col gap-6 self-start pb-16">
            
            {/* Save Success Alert Banner */}
            {saveSuccess && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg flex items-center gap-3 shadow-sm animate-fade-in">
                <Check className="text-emerald-500 flex-shrink-0" size={18} />
                <span className="text-sm text-emerald-800 font-medium">Form progress saved successfully!</span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center gap-3 shadow-sm">
                <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                <span className="text-sm text-red-800 font-medium">{error}</span>
              </div>
            )}

            {/* Form Main Container */}
            <div 
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              style={{ backgroundColor: settings.backgroundColor }}
            >
              {/* Decorative top bar styled by primaryColor */}
              <div className="h-2.5" style={{ backgroundColor: settings.primaryColor }} />

              <div className="p-8 space-y-2 border-b border-slate-100">
                <input
                  type="text"
                  placeholder="Form Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-3xl font-black focus:outline-none border-b border-transparent focus:border-slate-200 pb-1 text-slate-800"
                />
                <textarea
                  placeholder="Form description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm text-slate-500 focus:outline-none border-b border-transparent focus:border-slate-200 py-1 bg-transparent resize-none h-16"
                />
              </div>

              {/* Fields List */}
              <div className="p-8 space-y-8">
                {fields.length > 0 ? (
                  fields.map((field, index) => {
                    const isSelected = field.id === selectedFieldId;
                    
                    return (
                      <div
                        key={field.id}
                        onClick={() => {
                          setSelectedFieldId(field.id);
                          setActiveTab('configure');
                        }}
                        className={`relative p-5 border rounded-xl transition duration-150 cursor-pointer group ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500' 
                            : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/50'
                        }`}
                      >
                        {/* Hover utility controls */}
                        <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 shadow-sm rounded-lg p-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-slate-100"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                            disabled={index === fields.length - 1}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-slate-100"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteField(field.id); }}
                            className="p-1 text-slate-400 hover:text-red-650 rounded hover:bg-red-50"
                            title="Delete Field"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Field Header Label */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="font-bold text-slate-800 text-sm">{field.label}</span>
                          {field.required && <span className="text-red-500 font-bold">*</span>}
                        </div>

                        {/* Field Render Preview */}
                        <div className="pointer-events-none">
                          {field.type === 'text' && (
                            <input
                              type="text"
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 text-sm focus:outline-none"
                            />
                          )}
                          {field.type === 'textarea' && (
                            <textarea
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 text-sm focus:outline-none resize-none h-16"
                            />
                          )}
                          {field.type === 'email' && (
                            <input
                              type="email"
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 text-sm focus:outline-none"
                            />
                          )}
                          {field.type === 'number' && (
                            <input
                              type="number"
                              placeholder={field.placeholder}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 text-sm focus:outline-none"
                            />
                          )}
                          {field.type === 'date' && (
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-400 bg-slate-50 text-sm focus:outline-none"
                            />
                          )}
                          {field.type === 'select' && (
                            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 text-sm focus:outline-none">
                              <option value="">{field.placeholder || 'Select option...'}</option>
                              {field.options.map((opt, idx) => (
                                <option key={idx} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                          {field.type === 'radio' && (
                            <div className="space-y-1.5 mt-2">
                              {field.options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input type="radio" className="text-indigo-650" disabled />
                                  <span className="text-slate-650 text-sm">{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {field.type === 'checkbox' && (
                            <div className="space-y-1.5 mt-2">
                              {field.options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input type="checkbox" className="text-indigo-650 rounded" disabled />
                                  <span className="text-slate-650 text-sm">{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-250 rounded-xl p-6 text-slate-400 text-sm">
                    Your form currently has no fields. Select "Add Field" in the side panel to insert options.
                  </div>
                )}
              </div>
            </div>

            {/* Form Action Submit Button Mock Preview */}
            <div className="flex justify-end">
              <button
                disabled
                className="px-6 py-2.5 rounded-lg text-white font-bold text-sm pointer-events-none opacity-80"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {settings.buttonText}
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar options (Add / Customize / Design Settings) */}
        <div className="w-80 border-l border-slate-200 bg-white flex flex-col flex-shrink-0">
          {/* Sidebar Tab Header */}
          <div className="flex border-b border-slate-200 flex-shrink-0">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-3 text-center text-xs font-bold border-b-2 tracking-wide transition ${
                activeTab === 'add' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Add Field
            </button>
            <button
              onClick={() => setActiveTab('configure')}
              disabled={!selectedFieldId}
              className={`flex-1 py-3 text-center text-xs font-bold border-b-2 tracking-wide transition disabled:opacity-30 ${
                activeTab === 'configure' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Configure
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-center text-xs font-bold border-b-2 tracking-wide transition ${
                activeTab === 'settings' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Design
            </button>
          </div>

          {/* Sidebar Scroll Container */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Tab: Add Field */}
            {activeTab === 'add' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Field Elements</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {FIELD_TYPES.map((ft) => {
                    const Icon = ft.icon;
                    return (
                      <button
                        key={ft.type}
                        onClick={() => handleAddField(ft.type)}
                        className="w-full flex items-center gap-3 p-3 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20 rounded-xl text-left transition text-sm font-medium text-slate-700"
                      >
                        <span className="p-1.5 bg-slate-100 rounded-lg text-slate-500 group-hover:text-indigo-600">
                          <Icon size={16} />
                        </span>
                        <span>{ft.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Configure Field */}
            {activeTab === 'configure' && selectedField && (
              <div className="space-y-5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Field Options</span>
                  <button
                    onClick={() => handleDeleteField(selectedField.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Field Label Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Field Label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => handleUpdateField(selectedField.id, { label: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Field Placeholder Input (except for choices/date) */}
                {!['radio', 'checkbox', 'date'].includes(selectedField.type) && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Placeholder Text</label>
                    <input
                      type="text"
                      value={selectedField.placeholder || ''}
                      onChange={(e) => handleUpdateField(selectedField.id, { placeholder: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Required switch */}
                <div className="flex items-center justify-between py-2 border-y border-slate-100">
                  <label className="text-xs font-bold text-slate-700">Required Field</label>
                  <button
                    onClick={() => handleUpdateField(selectedField.id, { required: !selectedField.required })}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      selectedField.required ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        selectedField.required ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Multiple Choice / Dropdown Option inputs */}
                {['select', 'radio', 'checkbox'].includes(selectedField.type) && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">Choice Options</label>
                      <button
                        onClick={() => handleAddOption(selectedField.id)}
                        className="text-xs text-indigo-650 hover:text-indigo-700 font-bold flex items-center gap-1.5 transition"
                      >
                        <Plus size={12} />
                        <span>Add Option</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedField.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(selectedField.id, idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-850 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => handleDeleteOption(selectedField.id, idx)}
                            disabled={selectedField.options.length <= 1}
                            className="text-slate-400 hover:text-red-500 disabled:opacity-30 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Design / Form Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 block">Form Aesthetics</span>

                {/* Theme Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Color Palette Theme</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="light">Classic Clean Light</option>
                    <option value="dark">Professional Dark</option>
                  </select>
                </div>

                {/* Primary Color Picker */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Primary Theme Color</label>
                  <div className="flex gap-2.5 items-center">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Background Color Picker */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Card Background Color</label>
                  <div className="flex gap-2.5 items-center">
                    <input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                      className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={settings.backgroundColor}
                      onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Button Text */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Submit Button Text</label>
                  <input
                    type="text"
                    value={settings.buttonText}
                    onChange={(e) => setSettings({ ...settings, buttonText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
