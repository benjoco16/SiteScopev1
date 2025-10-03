import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    danger: 'bg-danger-100 text-danger-800',
    warning: 'bg-warning-100 text-warning-800',
    info: 'bg-primary-100 text-primary-800',
    // Status-specific variants
    up: 'bg-success-100 text-success-800',
    down: 'bg-danger-100 text-danger-800',
    unknown: 'bg-gray-100 text-gray-800',
    warning_status: 'bg-warning-100 text-warning-800'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge;
