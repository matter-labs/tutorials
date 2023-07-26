import React from "react";

type TextProps = {
  children: React.ReactNode;
};

const Text = ({ children }: TextProps) => {
  return (
    <div>
      <p className="text-base text-center max-w-lg">{children}</p>
    </div>
  );
};

export default Text;
