import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, sendVerificationEmail } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircleIcon, MailIcon } from "lucide-react";

// Define the base form types
interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData extends LoginFormData {
  passwordConfirm: string;
}

// Base schema for login
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Extended schema for registration with password confirmation
const registerSchema = loginSchema.extend({
  passwordConfirm: z.string().min(1, "Please confirm your password"),
}).refine((data: { password: string; passwordConfirm: string }) => {
  return data.password === data.passwordConfirm;
}, {
  message: "Passwords do not match",
  path: ["passwordConfirm"],
});

interface EmailAuthFormProps {
  mode: "register" | "login";
  onSuccess: () => void;
  onSwitchMode?: () => void;
}

export default function EmailAuthForm({ mode, onSuccess, onSwitchMode }: EmailAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Use the appropriate schema based on the current mode
  const schema = mode === "register" ? registerSchema : loginSchema;
  
  // Use a single type that can work for both modes
  type FormData = RegisterFormData;
  
  // Initialize form with the appropriate schema
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      ...(mode === "register" ? { passwordConfirm: "" } : {}),
    } as any, // Cast to any to avoid type issues with conditional fields
    mode: "onChange",
  });
  
  // Reset form when mode changes
  useEffect(() => {
    form.reset({
      email: "",
      password: "",
      ...(mode === "register" ? { passwordConfirm: "" } : {}),
    } as any); // Cast to any to avoid type issues with conditional fields
    // Also reset verification status
    setVerificationEmailSent(false);
  }, [mode, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (mode === "register") {
        // Create the user account
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        
        // Send verification email
        await sendVerificationEmail();
        
        // Show success message
        setVerificationEmailSent(true);
        
        toast({
          title: "Registration Successful",
          description: "A verification email has been sent to your email address.",
        });
        
        // Don't call onSuccess yet - they need to verify their email
      } else {
        // Login flow
        await signInWithEmailAndPassword(auth, data.email, data.password);
        
        // Check email verification status
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
          // If email isn't verified, show warning and do NOT log them in
          toast({
            variant: "destructive",
            title: "Email Not Verified",
            description: "Please verify your email before logging in.",
          });
          
          // Set verification status to show resend option
          setVerificationEmailSent(true);
          
          // Sign out the user since they can't proceed without verification
          auth.signOut();
          return;
        }
        
        // Complete the login (only for verified emails)
        onSuccess();
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Failed to authenticate. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const resendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      await sendVerificationEmail();
      toast({
        title: "Email Sent",
        description: "A new verification email has been sent to your address.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send verification email.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationEmailSent) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Verification Email Sent</AlertTitle>
          <AlertDescription className="text-green-700">
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </AlertDescription>
        </Alert>
        
        <div className="text-center space-y-4 my-4">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or click below to resend.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={resendVerificationEmail}
            disabled={isLoading}
            className="w-full"
          >
            <MailIcon className="mr-2 h-4 w-4" />
            {isLoading ? "Sending..." : "Resend Verification Email"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              // Clear verification status and go back to login mode
              setVerificationEmailSent(false);
              auth.signOut();
              
              // If onSwitchMode is provided, use it to toggle back to login mode
              if (onSwitchMode && mode === "register") {
                onSwitchMode();
              } else {
                // Fallback to direct navigation
                setLocation("/login");
              }
            }}
            className="w-full mt-2"
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === "register" && (
          <FormField
            control={form.control}
            name="passwordConfirm" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Please wait..." : mode === "register" ? "Register" : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}