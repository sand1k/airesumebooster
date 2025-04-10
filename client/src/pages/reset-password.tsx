import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { CheckCircleIcon, AlertTriangleIcon } from "lucide-react";

// Password reset form schema with confirmation
const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  passwordConfirm: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords do not match",
  path: ["passwordConfirm"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [actionCode, setActionCode] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
  });

  // Extract action code from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("oobCode");
    
    if (!code) {
      setResetError("Invalid or missing reset code. Please try the reset link from your email again.");
      return;
    }
    
    setActionCode(code);
    
    // Verify the action code and get the associated email
    const verifyCode = async () => {
      try {
        setIsLoading(true);
        const email = await verifyPasswordResetCode(auth, code);
        setEmail(email);
      } catch (error: any) {
        console.error("Error verifying reset code:", error);
        setResetError("Invalid or expired reset link. Please request a new password reset.");
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyCode();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!actionCode) {
      setResetError("Missing reset code. Please try again.");
      return;
    }

    try {
      setIsLoading(true);
      await confirmPasswordReset(auth, actionCode, data.password);
      setResetSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. You can now login with your new password.",
      });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      setResetError(error.message || "Failed to reset password. Please try again.");
      toast({
        variant: "destructive",
        title: "Reset Error",
        description: error.message || "Failed to reset password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resetError && (
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{resetError}</AlertDescription>
            </Alert>
          )}

          {resetSuccess ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Password Reset Successful</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your password has been reset successfully.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => setLocation("/login")}>
                Return to Login
              </Button>
            </div>
          ) : (
            email && (
              <>
                <p className="text-center text-muted-foreground mb-4">
                  Create a new password for <strong>{email}</strong>
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter new password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passwordConfirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm new password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Reset Password"}
                    </Button>
                  </form>
                </Form>
              </>
            )
          )}

          {!email && !resetError && !resetSuccess && (
            <div className="flex justify-center">
              <p>Verifying reset link...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}