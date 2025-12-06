import React from 'react';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  className?: string;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, disabled, variant = 'primary', className = '' }) => {
  const baseStyles = "w-full py-4 rounded-xl font-bold text-base tracking-wide uppercase transition-all active:scale-95";
  
  const variants = {
    primary: "bg-france-red text-white hover:bg-red-600 shadow-lg shadow-france-red/30",
    secondary: "bg-france-card text-white hover:bg-france-lightBlue border border-france-lightBlue/30",
    danger: "bg-red-800 text-white hover:bg-red-700",
    gold: "bg-gradient-to-r from-[#B8860B] via-premium-gold to-[#B8860B] text-black hover:brightness-110 shadow-lg shadow-premium-gold/20 border border-yellow-500/30"
  };

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed active:scale-100' : ''} ${className}`}
    >
      {title}
    </button>
  );
};

export default PrimaryButton;