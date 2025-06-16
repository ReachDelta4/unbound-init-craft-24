
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Tabs,
  TabsContent
} from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { UserCircle, Briefcase, File, Calendar, ArrowLeft, Settings } from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarProvider, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger
} from "@/components/ui/sidebar";
import PersonalTab from "@/components/profile/PersonalTab";
import BusinessTab from "@/components/profile/BusinessTab";
import DocumentsTab from "@/components/profile/DocumentsTab";
import MeetingHistoryTab from "@/components/profile/MeetingHistoryTab";
import ModelSettingsTab from "@/components/profile/ModelSettingsTab";
import { Button } from "@/components/ui/button";

type TabType = "personal" | "business" | "documents" | "meetings" | "model-settings";

const Profile = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("personal");

  // Only redirect to auth page if not loading and definitely no user
  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Show loading or return null while checking auth state
  if (isLoading) {
    return (
      <div className="h-screen w-full bg-background text-foreground flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="h-screen w-full bg-background text-foreground flex">
        {/* Sidebar */}
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <h2 className="text-xl font-bold truncate">Profile Settings</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "personal"} 
                  onClick={() => setActiveTab("personal")}
                  tooltip="Personal Info"
                >
                  <UserCircle />
                  <span>Personal</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "business"} 
                  onClick={() => setActiveTab("business")}
                  tooltip="Business Details"
                >
                  <Briefcase />
                  <span>Business Details</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "documents"} 
                  onClick={() => setActiveTab("documents")}
                  tooltip="Attached Documents"
                >
                  <File />
                  <span>Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "meetings"} 
                  onClick={() => setActiveTab("meetings")}
                  tooltip="Meeting History"
                >
                  <Calendar />
                  <span>Meeting History</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === "model-settings"} 
                  onClick={() => setActiveTab("model-settings")}
                  tooltip="AI Model Settings"
                >
                  <Settings />
                  <span>Model Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-2">
              <Button 
                onClick={() => navigate("/")}
                className="w-full px-3 py-2 flex justify-center items-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-card p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Dashboard</span>
              </Button>
              <h1 className="text-xl font-semibold">
                {activeTab === "personal" && "Personal Information"}
                {activeTab === "business" && "Business Details"}
                {activeTab === "documents" && "Documents"}
                {activeTab === "meetings" && "Meeting History"}
                {activeTab === "model-settings" && "AI Model Settings"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          
          <div className="flex-1 overflow-auto p-6">
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="personal" className="mt-0">
                <PersonalTab user={user} />
              </TabsContent>
              <TabsContent value="business" className="mt-0">
                <BusinessTab user={user} />
              </TabsContent>
              <TabsContent value="documents" className="mt-0">
                <DocumentsTab user={user} />
              </TabsContent>
              <TabsContent value="meetings" className="mt-0">
                <MeetingHistoryTab user={user} />
              </TabsContent>
              <TabsContent value="model-settings" className="mt-0">
                <ModelSettingsTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Profile;
