import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Phi3Provider } from "@/contexts/Phi3Context";
import Index from "./pages/Index";
import AuthPage from "./pages/auth/AuthPage";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import { MeetingStateProvider } from "@/hooks/use-meeting-state";
import StickyCallBar from "@/components/StickyCallBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import TestComponent from "@/components/TestComponent";
import DebugInfo from "@/components/DebugInfo";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="meeting-assistant-theme">
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <ErrorBoundary>
                <Phi3Provider>
                  <MeetingStateProvider>
                    <TestComponent />
                    <StickyCallBar />
                    <Toaster />
                    <Sonner />
                    <DebugInfo />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth/*" element={<AuthPage />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </MeetingStateProvider>
                </Phi3Provider>
              </ErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
