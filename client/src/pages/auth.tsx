import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const { login, signup, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: signupRegister,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onLogin = async (data: LoginValues) => {
    try {
      await login(data);
      toast({ title: "Logged in successfully!" });
      setLocation("/");
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  };

  const onSignup = async (data: SignupValues) => {
    try {
      await signup(data);
      toast({ title: "Signed up successfully!" });
      setLocation("/");
    } catch (error: any) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center">
      <Card className="w-[400px] cyber-card">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-black neon-text glitch-title" data-text={isLogin ? "LOGIN" : "SIGNUP"}>
            {isLogin ? "LOGIN" : "SIGNUP"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input id="login-username" {...loginRegister("username")} />
                {loginErrors.username && <p className="text-red-500 text-xs">{loginErrors.username.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" {...loginRegister("password")} />
                {loginErrors.password && <p className="text-red-500 text-xs">{loginErrors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full cyber-button" disabled={isLoginSubmitting}>
                {isLoginSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input id="signup-username" {...signupRegister("username")} />
                {signupErrors.username && <p className="text-red-500 text-xs">{signupErrors.username.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" {...signupRegister("password")} />
                {signupErrors.password && <p className="text-red-500 text-xs">{signupErrors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full cyber-button" disabled={isSignupSubmitting}>
                {isSignupSubmitting ? "Signing up..." : "Sign Up"}
              </Button>
            </form>
          )}
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
