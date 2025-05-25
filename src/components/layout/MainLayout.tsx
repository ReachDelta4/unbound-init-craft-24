import React from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { Button } from "@/components/ui/button";
import { useMeetingState } from "@/hooks/use-meeting-state";
import CallInProgressDialog from "@/components/CallInProgressDialog";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainLayout = ({ children, title = "Invisible AI Meeting Assistant" }: MainLayoutProps) => {
  const navigate = useNavigate();
  const { isCallActive, activeMeeting } = useMeetingState();
  const [showCallDialog, setShowCallDialog] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<string | null>(null);

  // Intercept navigation
  const handleNavigate = (path: string) => {
    if (isCallActive || (activeMeeting && activeMeeting.status === 'active')) {
      setPendingNavigation(path);
      setShowCallDialog(true);
    } else {
      navigate(path);
    }
  };

  // Handle dialog actions
  const handleReturnToCall = () => {
    setShowCallDialog(false);
    setPendingNavigation(null);
    navigate("/"); // or your call page route
  };
  const handleContinue = () => {
    setShowCallDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col">
      <header className="bg-card p-4 border-b border-border flex items-center justify-between">
        <div className="flex-1">
          {/* Spacer */}
        </div>
        <h1 className="text-xl font-semibold text-center flex-1">{title}</h1>
        <div className="flex-1 flex justify-end items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleNavigate("/profile")}
            className="flex items-center gap-2"
          >
            Profile
          </Button>
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      
      {children}
      <CallInProgressDialog
        open={showCallDialog}
        onReturnToCall={handleReturnToCall}
        onContinue={handleContinue}
      />
    </div>
  );
};

export default MainLayout;
