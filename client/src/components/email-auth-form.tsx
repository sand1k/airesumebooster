import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
}

export default function EmailAuthForm({ mode, onSuccess }: EmailAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
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
  }, [mode, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
      } else {
        await signInWithEmailAndPassword(auth, data.email, data.password);
      }
      onSuccess();
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