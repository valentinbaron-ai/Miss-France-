import React from 'react';

interface ThemeIconProps {
  variant: 'home' | 'play' | 'pronos' | 'teams' | 'rules';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

const ThemeIcon: React.FC<ThemeIconProps> = ({ variant, className = '', size = 'md', active }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const getPath = () => {
    switch (variant) {
      case 'home': // Crown
        return "M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V17H19V19Z";
      case 'play': // Star/Sparkle
        return "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
      case 'pronos': // Crystal Ball style (Circle with star)
        return "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4.6l3.3 2-1 1.7L11 12.8V7z"; // Stylized clock/future
      case 'teams': // Shield/Group
        return "M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm4 11H8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z";
      case 'rules': // Scroll/Book
        return "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z";
      default:
        return "";
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        className={`${sizeClasses[size]} transition-all duration-300 ${active ? 'text-premium-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]' : 'text-zinc-600 group-hover:text-premium-gold/70'}`} 
        viewBox="0 0 24 24" 
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={getPath()} />
      </svg>
      
      {/* Tricolor Underline - Only visible if active or specific condition met, but user asked to stick to theme */}
      <div className={`flex h-1 mt-1 rounded-full overflow-hidden w-full max-w-[24px] transition-opacity duration-300 ${active ? 'opacity-100 shadow-lg shadow-white/20' : 'opacity-0'}`}>
        <div className="flex-1 bg-france-blue"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-france-red"></div>
      </div>
    </div>
  );
};

export default ThemeIcon;