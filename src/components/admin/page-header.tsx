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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-8 relative"
    >
      <div className="absolute -left-4 lg:-left-8 top-0 w-1.5 h-16 bg-primary rounded-r-full shadow-lg shadow-primary/20" />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-800 dark:text-foreground flex items-center gap-4">
            {title}
            <Icon className="h-8 w-8 text-primary" />
          </h1>
          {subtitle && (
            <p className="text-slate-500 dark:text-muted-foreground font-medium mt-1 text-sm flex items-center gap-2">
              <span className="h-px w-8 bg-slate-200 dark:bg-border" />
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {rightContent}
          {action && (
            <Button
              onClick={action.onClick}
              className="h-11 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-[0.98] rounded-xl px-6"
            >
              {action.icon && <action.icon className="mr-3 h-4 w-4" />}
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
