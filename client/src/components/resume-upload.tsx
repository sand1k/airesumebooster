import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function ResumeUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        throw new Error("Please sign in to upload resumes");
      }

      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files are allowed");
      }

      const formData = new FormData();
      formData.append("file", file);

      const idToken = await user.getIdToken();
      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Upload failed with status ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/resumes/user/${user?.uid}`] });
      toast({
        title: "Success",
        description: "Resume uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
        id="resume-upload"
      />
      <Button
        asChild
        disabled={isUploading}
        className="cursor-pointer"
      >
        <label htmlFor="resume-upload" className="cursor-pointer flex items-center">
          {isUploading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Resume
            </>
          )}
        </label>
      </Button>
    </div>
  );
}
