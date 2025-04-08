import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { signInWithGoogle, auth, sendVerificationEmail } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { SiGoogle } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import EmailAuthForm from "@/components/email-auth-form";
import { MailCheckIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationCheck, setShowVerificationCheck] = useState(false);
  const [email, setEmail] = useState("");

  const handleSuccess = () => {
    setLocation("/dashboard");
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      handleSuccess();
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google. Please try again."
      });
    }
  };
  
  const handleCheckVerification = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to check verification status."
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Try to sign in with a dummy password to trigger the Firebase auth error
      // This will tell us if the user exists
      try {
        await signInWithEmailAndPassword(auth, email, "dummy-password-for-check");
      } catch (error: any) {
        // If the error code is "auth/wrong-password", it means the user exists
        // but the password is wrong, which is what we want
        if (error.code !== "auth/wrong-password") {
          throw error;
        }
      }
      
      // If we got here, the user exists, now we can check if they're verified
      const user = auth.currentUser;
      if (user) {
        if (user.emailVerified) {
          toast({
            title: "Email Verified",
            description: "Your email is already verified. You can now log in."
          });
          // Sign them out because we only checked status
          await auth.signOut();
        } else {
          // Not verified, offer to resend verification email
          const confirmed = window.confirm(
            "Your email is not verified. Would you like to resend the verification email?"
          );
          
          if (confirmed) {
            await sendVerificationEmail();
            toast({
              title: "Verification Email Sent",
              description: "Please check your inbox and click the verification link."
            });
          }
          // Sign them out because we only checked status
          await auth.signOut();
        }
      } else {
        // No user found with that email
        toast({
          variant: "destructive",
          title: "User Not Found",
          description: "No account found with this email address. Please register first."
        });
      }
    } catch (error: any) {
      console.error("Verification check error:", error);
      
      if (error.code === "auth/user-not-found") {
        toast({
          variant: "destructive",
          title: "User Not Found",
          description: "No account found with this email address. Please register first."
        });
      } else if (error.code === "auth/invalid-email") {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: "Please enter a valid email address."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to check verification status."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Resume AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Get AI-powered suggestions to improve your resume
          </p>

          <div className="space-y-4">
            <EmailAuthForm mode={isRegistering ? "register" : "login"} onSuccess={handleSuccess} />
            <p className="text-sm text-center text-muted-foreground">
              {isRegistering ? (
                <>Already have an account? <Button variant="link" className="p-0" onClick={() => setIsRegistering(false)}>Sign in</Button></>
              ) : (
                <>Don't have an account? <Button variant="link" className="p-0" onClick={() => setIsRegistering(true)}>Register</Button></>
              )}
            </p>

            {!isRegistering && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={handleGoogleLogin}
                  size="lg"
                >
                  <SiGoogle className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {showVerificationCheck ? (
            <div className="space-y-4 w-full">
              <h3 className="text-sm font-medium">Check Email Verification Status</h3>
              <div className="space-y-2">
                <Label htmlFor="verification-email">Email</Label>
                <Input 
                  id="verification-email" 
                  type="email" 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  className="flex-1"
                  onClick={handleCheckVerification} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <MailCheckIcon className="mr-2 h-4 w-4" />
                      Check Status
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowVerificationCheck(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="link"
              onClick={() => setShowVerificationCheck(true)}
              className="w-full text-sm text-muted-foreground"
            >
              <MailCheckIcon className="mr-2 h-4 w-4" />
              Check Email Verification Status
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}