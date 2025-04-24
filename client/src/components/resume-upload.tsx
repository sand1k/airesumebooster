import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function ResumeUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Please sign in to upload resumes");
      }

      const formData = new FormData();
      formData.append("file", file);
      
      // Get the ID token
      const idToken = await user.getIdToken();
      
      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData,
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Upload failed with status ${res.status}`);
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
      toast({
        title: "Success",
        description: "Resume uploaded successfully"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload resume"
      });
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a PDF file"
      });
      return;
    }

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        id="resume-upload"
      />
      <Button 
        asChild
        disabled={isUploading}
      >
        <label htmlFor="resume-upload" className="cursor-pointer">
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload Resume"}
        </label>
      </Button>
    </div>
  );
}
