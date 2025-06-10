
import React, { useRef } from "react";

interface MeetingLayoutProps {
  children: React.ReactNode;
}

const MeetingLayout = ({ children }: MeetingLayoutProps) => {
  const mainContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={mainContainerRef}
      className="h-screen w-full flex flex-col bg-background overflow-hidden"
      style={{ height: '100vh' }}
    >
      {children}
    </div>
  );
};

export default MeetingLayout;
