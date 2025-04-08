import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadIcon, LogOut, AlertTriangleIcon, MailIcon } from "lucide-react";
import ResumeUpload from "@/components/resume-upload";
import { auth, signOut, sendVerificationEmail } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { Resume } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);
  const { toast } = useToast();
  
  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ['/api/resumes']
  });

  // Check if the user's email is verified
  useEffect(() => {
    const checkEmailVerification = () => {
      const user = auth.currentUser;
      if (user) {
        setIsEmailVerified(user.emailVerified);
      }
    };
    
    // Check immediately
    checkEmailVerification();
    
    // Set up listener for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsEmailVerified(user.emailVerified);
      } else {
        // Not logged in
        setLocation('/login');
      }
    });
    
    return () => unsubscribe();
  }, [setLocation]);
  
  const handleResendVerification = async () => {
    try {
      setSendingVerification(true);
      await sendVerificationEmail();
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and click the verification link."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification email."
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setLocation('/login');
  };

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
        {isEmailVerified === false && (
          <Alert className="bg-amber-50 border-amber-200 mb-6">
            <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Email Not Verified</AlertTitle>
            <AlertDescription className="text-amber-700">
              Please verify your email address to unlock all features. 
              <Button
                variant="link"
                className="px-2 text-amber-800 font-semibold underline"
                onClick={handleResendVerification}
                disabled={sendingVerification}
              >
                {sendingVerification ? (
                  <>Sending verification email...</>
                ) : (
                  <>
                    <MailIcon className="h-4 w-4 mr-1" />
                    Resend verification email
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Your Resumes</h1>
          <div className="flex items-center gap-4">
            <ResumeUpload />
            <Button 
              variant="outline"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
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