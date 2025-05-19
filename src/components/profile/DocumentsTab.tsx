
import React from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { File, FileText, X } from "lucide-react";

interface DocumentsTabProps {
  user: User;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload documents like sales templates, presentations, or other resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center">
              <File className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your files here, or click to browse
              </p>
              <div className="relative mt-2">
                <Input
                  id="fileUpload"
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  multiple
                />
                <Button variant="outline">Browse Files</Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Supported file types: PDF, DOCX, PPTX, XLSX (Max size: 10MB)
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
          <CardDescription>
            Manage your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Document list */}
            <div className="space-y-2">
              <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Sales_Pitch_Template.pdf</p>
                    <p className="text-xs text-muted-foreground">Uploaded on: May 19, 2025</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">View</Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Q2_Results_Presentation.pptx</p>
                    <p className="text-xs text-muted-foreground">Uploaded on: May 18, 2025</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">View</Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Company_Overview_2025.docx</p>
                    <p className="text-xs text-muted-foreground">Uploaded on: May 15, 2025</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">View</Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsTab;
