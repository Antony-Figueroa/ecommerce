import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  rightContent?: React.ReactNode;
}

export function AdminPageHeader({ title, subtitle, icon: Icon, action, rightContent }: AdminPageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 relative"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            {Icon && <Icon className="h-6 w-6 text-primary" />}
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-500 font-medium mt-1 text-sm dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {rightContent}
          {action && (
            <Button
              onClick={action.onClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg px-4 h-10 font-medium text-sm transition-colors"
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
