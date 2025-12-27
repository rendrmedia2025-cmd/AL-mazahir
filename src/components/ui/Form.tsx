import React from 'react';
import { cn } from '@/lib/utils';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  error?: string;
}

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => (
    <form
      ref={ref}
      className={cn('space-y-4 sm:space-y-6', className)}
      {...props}
    >
      {children}
    </form>
  )
);

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, error, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('space-y-2', className)}
      {...props}
    >
      {children}
      {error && (
        <p className="text-sm text-red-600 text-readable" role="alert">
          {error}
        </p>
      )}
    </div>
  )
);

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium text-gray-700 text-readable block',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
);

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-readable touch-target',
        'sm:h-11 sm:px-3 sm:py-2 sm:text-sm', // Smaller on larger screens
        error && 'border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  )
);

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-readable resize-y',
        'sm:min-h-[80px] sm:px-3 sm:py-2 sm:text-sm', // Smaller on larger screens
        error && 'border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  )
);

Form.displayName = 'Form';
FormField.displayName = 'FormField';
Label.displayName = 'Label';
Input.displayName = 'Input';
Textarea.displayName = 'Textarea';

export { Form, FormField, Label, Input, Textarea };