import React from "react";

type TextProps = {
  children: React.ReactNode;
  className?: string;
};

const Text = ({ children, className = "" }: TextProps) => {
  return (
    <div>
      <p className={`text-base text-center max-w-lg ${className}`}>
        {children}
      </p>
    </div>
  );
};

export default Text;
