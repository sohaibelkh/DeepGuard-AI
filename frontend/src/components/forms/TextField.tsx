import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon: LucideIcon;
}

export const TextField: React.FC<TextFieldProps> = ({ label, error, icon: Icon, ...inputProps }) => {
  return (
    <div className="form-group">
      <label>{label}</label>
      <div className={`input-wrapper ${error ? 'error' : ''}`}>
        <Icon />
        <input {...inputProps} />
      </div>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
};
