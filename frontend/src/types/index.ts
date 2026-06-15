export interface User {
  id: string;
  name: string;
  email: string;
}

export type FieldType = 'text' | 'textarea' | 'email' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'file';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options: string[];
}

export interface FormSettings {
  theme: string;
  primaryColor: string;
  backgroundColor: string;
  buttonText: string;
}

export interface Form {
  _id: string;
  title: string;
  description: string;
  userId: string;
  fields: FormField[];
  settings: FormSettings;
  isPublished: boolean;
  viewsCount: number;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormResponse {
  _id: string;
  formId: string;
  answers: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionTimelineItem {
  date: string;
  submissions: number;
}

export interface FieldAnalyticsItem {
  type: string;
  label: string;
  summary: Record<string, number>;
}

export interface FormAnalytics {
  views: number;
  submissions: number;
  conversionRate: number;
  fieldAnalytics: Record<string, FieldAnalyticsItem>;
  submissionTimeline: SubmissionTimelineItem[];
}
