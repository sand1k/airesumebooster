import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadIcon } from "lucide-react";
import ResumeUpload from "@/components/resume-upload";
import type { Resume } from "@shared/schema";

export default function Dashboard() {
  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ['/api/resumes']
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Your Resumes</h1>
          <ResumeUpload />
        </div>

        <ScrollArea className="h-[600px] pr-4">
          {resumes?.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="space-y-4">
                <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No resumes uploaded yet. Upload your first resume to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {resumes?.map((resume) => (
                <Card key={resume.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Resume #{resume.id}</span>
                      <Button asChild>
                        <Link href={`/resume/${resume.id}`}>
                          View Analysis
                        </Link>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Uploaded on {resume.uploadedAt ? new Date(resume.uploadedAt).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}