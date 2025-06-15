import React from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({ 
  message, 
  type = 'success',
  onClose 
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { 
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-800 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'error':
        return { 
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-800 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case 'info':
        return { 
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-800 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
    }
  };

  const { bgColor, textColor, borderColor } = getIconAndColor();

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-3 rounded-md shadow-sm border mx-auto',
      'whitespace-nowrap overflow-visible',
      bgColor,
      borderColor
    )}>
      <span className={cn('text-sm font-medium text-left whitespace-nowrap', textColor)}>
        {message}
      </span>
      <button 
        onClick={onClose} 
        className={cn(
          'ml-3 flex-shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors',
          textColor
        )}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const showCustomToast = (
  message: string, 
  type: 'success' | 'error' | 'info' = 'success',
  duration = 2000
) => {
  return toast.custom(
    (id) => (
      <CustomToast 
        message={message} 
        type={type} 
        onClose={() => toast.dismiss(id)} 
      />
    ),
    {
      duration,
      position: 'top-center',
      className: 'mx-auto left-1/2 transform -translate-x-1/2 w-auto',
      style: {
        width: 'auto',
        maxWidth: '80vw',
        marginLeft: 'auto',
        marginRight: 'auto',
      }
    }
  );
};