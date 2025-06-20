import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = "" }) => {
  return (
    <div className={`p-6 pb-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardContentProps> = ({ children, className = "" }) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = "" }) => {
  return (
    <div className={`p-6 pt-0 border-t border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = "" }) => {
  return (
    <h3 className={`text-lg font-semibold text-yellow-400 ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = "" }) => {
  return (
    <p className={`text-sm text-gray-400 ${className}`}>
      {children}
    </p>
  );
}; 