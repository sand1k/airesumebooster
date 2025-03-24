import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/firebase";
import { SiGoogle } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import EmailAuthForm from "@/components/email-auth-form";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

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
      </Card>
    </div>
  );
}