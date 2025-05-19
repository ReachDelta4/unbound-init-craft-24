
import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";
import { useAuth } from "@/contexts/AuthContext";

type AuthTab = "login" | "signup" | "reset-password" | "update-password";

const AuthPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<AuthTab>(() => {
    if (location.pathname.endsWith("update-password")) return "update-password";
    if (location.pathname.endsWith("reset-password")) return "reset-password";
    if (location.pathname.endsWith("signup")) return "signup";
    return "login";
  });
  const { user, isLoading } = useAuth();

  // Redirect if already authenticated
  if (user && !isLoading) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {activeTab === "login" && "Sign In"}
            {activeTab === "signup" && "Create an Account"}
            {activeTab === "reset-password" && "Reset Password"}
            {activeTab === "update-password" && "Update Password"}
          </CardTitle>
          <CardDescription className="text-center">
            {activeTab === "login" && "Enter your credentials to access your account"}
            {activeTab === "signup" && "Fill in your details to create a new account"}
            {activeTab === "reset-password" && "Enter your email to reset your password"}
            {activeTab === "update-password" && "Enter your new password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === "login" && <LoginForm />}
          {activeTab === "signup" && <SignupForm />}
          {activeTab === "reset-password" && <ResetPasswordForm />}
          {activeTab === "update-password" && <UpdatePasswordForm />}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {activeTab === "login" && (
            <>
              <button
                onClick={() => setActiveTab("reset-password")}
                className="text-sm text-primary hover:underline"
              >
                Forgot your password?
              </button>
              <div className="text-sm text-center">
                Don't have an account?{" "}
                <button
                  onClick={() => setActiveTab("signup")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>
            </>
          )}
          {activeTab === "signup" && (
            <div className="text-sm text-center">
              Already have an account?{" "}
              <button
                onClick={() => setActiveTab("login")}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </div>
          )}
          {activeTab === "reset-password" && (
            <button
              onClick={() => setActiveTab("login")}
              className="text-sm text-primary hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
