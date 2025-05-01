import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadIcon, LogOut, AlertTriangleIcon, MailIcon, ExternalLink, FileText } from "lucide-react";
import ResumeUpload from "@/components/resume-upload";
import { auth, signOut, sendVerificationEmail } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Resume, Suggestion } from "@shared/schema";
import { useAuth } from '@/hooks/useAuth';
import { useQuery, Query } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from 'react-markdown';

interface SuggestionResponse {
  resumeId: string;
  suggestions: string;  // Raw markdown content
  createdAt: string;
}

export default function Dashboard() {
  const [sendingVerification, setSendingVerification] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const { data: resumes, isLoading, error } = useQuery<Resume[]>({
    queryKey: [`/api/resumes/user/${user?.uid}`],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/resumes/user/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch resumes' }));
        throw new Error(errorData.message || `Failed to fetch resumes (${res.status})`);
      }
      const data = await res.json();
      console.log('Received resumes:', data);
      return data;
    },
    enabled: !!user,
  });

  const { data: suggestions, isLoading: suggestionsLoading, refetch: refetchSuggestions } = useQuery<SuggestionResponse>({
    queryKey: [`/api/resumes/${selectedResumeId}/suggestions`, selectedResumeId],
    queryFn: async () => {
      if (!user || !selectedResumeId) return null;
      
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/resumes/${selectedResumeId}/suggestions`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          return { resumeId: selectedResumeId, suggestions: '', createdAt: new Date().toISOString() };
        }
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch suggestions' }));
        throw new Error(errorData.message || `Failed to fetch suggestions (${res.status})`);
      }
      return res.json();
    },
    enabled: !!selectedResumeId && !!user,
    refetchInterval: (query: Query<SuggestionResponse, Error>) => {
      // If we have suggestions, stop polling
      if (query.state.data?.suggestions && query.state.data.suggestions.length > 0) return false;
      // Otherwise, poll every 3 seconds
      return 3000;
    },
  });

  if (loading || isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }

  const handleViewResume = (url: string | null | undefined) => {
    console.log('Opening URL:', url, typeof url);
    if (!url) {
      console.error('No URL provided for resume');
      toast({
        title: "Error",
        description: "Unable to open resume - URL not available",
        variant: "destructive"
      });
      return;
    }

    try {
      new URL(url);
    } catch (e) {
      console.error('Invalid URL:', url, e);
      toast({
        title: "Error",
        description: "Unable to open resume - invalid URL",
        variant: "destructive"
      });
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewSuggestions = (resumeId: string) => {
    setSelectedResumeId(resumeId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Resumes</h1>
        <Button
          variant="outline"
          onClick={signOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
      <ResumeUpload />
      <div className="mt-8">
        {resumes && resumes.length > 0 ? (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Resume #{resume.id}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleViewResume(resume.file_url)}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Resume
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleViewSuggestions(String(resume.id))}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Suggestions
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Uploaded on {resume.uploaded_at ? new Date(resume.uploaded_at).toLocaleDateString() : 'Unknown date'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="w-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>No resumes uploaded yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedResumeId} onOpenChange={(open) => !open && setSelectedResumeId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resume Suggestions</DialogTitle>
            <DialogDescription>
              AI-powered suggestions to improve your resume
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 pr-4">
              {suggestionsLoading ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground animate-pulse">
                    Loading suggestions... This may take a few moments as we analyze your resume.
                  </p>
                </div>
              ) : suggestions?.suggestions ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{suggestions.suggestions}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    No suggestions available yet. Please wait a moment while we analyze your resume.
                    You can close this dialog and come back in a few seconds.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}