
import React from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { useMeetingState } from "@/hooks/use-meeting-state";
import CallInProgressDialog from "@/components/CallInProgressDialog";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const MainLayout = ({ children }: MainLayoutProps) => {
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
    navigate("/");
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
