import React from 'react';

const Button = ({ children, variant = 'primary', className = '', onClick, ...props }: any) => {
  const baseStyles = "px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
  const variants: any = {
    primary: "bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-500/30 border border-transparent",
    outline: "bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700",
    ghost: "text-gray-600 hover:text-green-600 hover:bg-green-50/50",
    white: "bg-white text-green-700 hover:bg-gray-100 shadow-md"
  };

  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;