import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-24',
    xl: 'h-32'
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Crown Icon */}
      <svg 
        className={`${sizes[size]} text-premium-gold drop-shadow-lg filter`} 
        viewBox="0 0 24 24" 
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V17H19V19Z" />
      </svg>
      
      {/* Tricolor Underline */}
      <div className="flex h-1.5 mt-1 shadow-lg shadow-white/10 rounded-full overflow-hidden w-[120%]">
        <div className="flex-1 bg-france-blue"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-france-red"></div>
      </div>
    </div>
  );
};

export default Logo;