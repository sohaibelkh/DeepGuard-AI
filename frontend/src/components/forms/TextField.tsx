import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'classnames';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon: LucideIcon;
}

export const TextField: React.FC<TextFieldProps> = ({ label, error, icon: Icon, ...inputProps }) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-300">{label}</label>
      <div
        className={clsx(
          'group flex items-center rounded-lg border bg-slate-950/40 px-3 ring-offset-slate-950 transition',
          'focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500',
          error ? 'border-red-500/80' : 'border-slate-800 hover:border-slate-700'
        )}
      >
        <Icon className="mr-2 h-4 w-4 flex-shrink-0 text-slate-500 group-focus-within:text-sky-400" />
        <input
          {...inputProps}
          className="h-9 w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
};

