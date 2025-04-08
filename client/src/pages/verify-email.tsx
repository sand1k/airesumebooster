import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircleIcon, XCircleIcon, Loader2Icon } from "lucide-react";
import { verifyEmail, auth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/verify-email");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const verifyUserEmail = async () => {
      // Get the action code from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const actionCode = urlParams.get("oobCode");

      if (!actionCode) {
        setStatus("error");
        setErrorMessage("Invalid verification link. No verification code found.");
        return;
      }

      try {
        // Verify the email with Firebase
        await verifyEmail(actionCode);
        setStatus("success");
        
        // Refresh the user to update the emailVerified property
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
        
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
        });
      } catch (error: any) {
        console.error("Error verifying email:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to verify your email. The link may have expired.");
      }
    };

    verifyUserEmail();
  }, [toast]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {status === "loading" && "Verifying your email..."}
            {status === "success" && "Your email has been verified"}
            {status === "error" && "Verification Failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex justify-center items-center py-8">
              <Loader2Icon className="h-12 w-12 text-primary animate-spin" />
            </div>
          )}

          {status === "success" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your email has been successfully verified. You can now use all features of the application.
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert className="bg-red-50 border-red-200">
              <XCircleIcon className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Verification Failed</AlertTitle>
              <AlertDescription className="text-red-700">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => setLocation("/")} 
            className="w-full"
          >
            {status === "success" ? "Continue to Dashboard" : "Return to Home"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}