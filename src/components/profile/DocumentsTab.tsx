import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { File, FileText, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  file_path: string;
}

interface DocumentsTabProps {
  user: User;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ user }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Fetch user documents
  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error.message);
      toast.error("Failed to load documents");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user.id]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        // Simple progress simulation since onUploadProgress is not available
        setUploadProgress(25);
        
        // Upload to Storage
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('user_documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        setUploadProgress(75);
        
        if (uploadError) throw uploadError;
        
        // Create document record in database
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_path: filePath,
          });
        
        if (dbError) throw dbError;
        setUploadProgress(100);
      }
      
      toast.success("Document(s) uploaded successfully");
      fetchDocuments(); // Refresh document list
    } catch (error: any) {
      console.error("Error uploading document:", error.message);
      toast.error("Failed to upload document: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user_documents')
        .remove([filePath]);
      
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (dbError) throw dbError;
      
      toast.success("Document deleted successfully");
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (error: any) {
      console.error("Error deleting document:", error.message);
      toast.error("Failed to delete document");
    }
  };

  // Handle document download
  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('user_documents')
        .download(filePath);
      
      if (error) throw error;
      
      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up object URL
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error("Error downloading document:", error.message);
      toast.error("Failed to download document");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button variant="outline" disabled={isUploading}>
                  {isUploading ? `Uploading... ${uploadProgress}%` : "Browse Files"}
                </Button>
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
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No documents uploaded yet</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-muted p-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded on: {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsTab;
