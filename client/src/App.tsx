import { useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ResumeView from "@/pages/resume-view";
import VerifyEmail from "@/pages/verify-email";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && location !== "/login") {
        setLocation("/login");
      }
    });

    return () => unsubscribe();
  }, [location, setLocation]);

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={() => <PrivateRoute component={Dashboard} />} />
      <Route path="/resume/:id" component={() => <PrivateRoute component={ResumeView} />} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}