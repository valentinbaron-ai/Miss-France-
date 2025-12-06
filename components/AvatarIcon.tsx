import React from 'react';

export type AvatarId = 
  | 'crown' 
  | 'diamond' 
  | 'star' 
  | 'sash' 
  | 'heel' 
  | 'rose' 
  | 'crystal' 
  | 'cocktail' 
  | 'mic' 
  | 'heart'
  | 'default';

interface AvatarIconProps {
  id: string; // Loose typing to allow string storage, but expects AvatarId
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AVATAR_PATHS: Record<string, string> = {
  crown: "M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V17H19V19Z",
  diamond: "M6 2L2 8L12 22L22 8L18 2H6ZM5.47 8H8.78L12 3.53L15.22 8H18.53L12 17.07L5.47 8Z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  sash: "M4 18l2.5-2.5 13.5-13.5 2 2-13.5 13.5L6 20 4 18zm2-4l-2 2 2 2 2-2-2-2z", // Simplified Sash representation
  heel: "M3 18v2h2l11-11v-3l-5-5h-3l-2 4 4 4-7 9z", // Abstract shoe/heel
  rose: "M12 22c4.97 0 9-4.03 9-9-4.97 0-9-4.03-9-9-4.97 0-9 4.03-9 9 0 4.97 4.03 9 9 9zm0-2c-3.87 0-7-3.13-7-7 3.87 0 7-3.13 7-7 3.87 0 7 3.13 7 7 0 3.87-3.13 7-7 7z", // Flower/Rose
  crystal: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z",
  cocktail: "M21 5V3H3v2l8 9v5H6v2h12v-2h-5v-5l8-9zM7.43 7L5.66 5h12.69l-1.78 2H7.43z",
  mic: "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  default: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" // User silhouette
};

export const AVAILABLE_AVATARS = Object.keys(AVATAR_PATHS).filter(k => k !== 'default');

const AvatarIcon: React.FC<AvatarIconProps> = ({ id, className = '', size = 'md' }) => {
  const path = AVATAR_PATHS[id] || AVATAR_PATHS['default'];

  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`flex items-center justify-center ${sizes[size]} ${className}`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className="w-full h-full drop-shadow-md"
      >
        <path d={path} />
      </svg>
    </div>
  );
};

export default AvatarIcon;