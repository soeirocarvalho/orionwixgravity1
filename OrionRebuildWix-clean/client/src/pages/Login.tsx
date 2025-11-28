import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState<'basic' | 'professional' | 'enterprise'>('professional');
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email || !userId) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and user ID",
        variant: "destructive",
      });
      return;
    }

    try {
      // Try calling backend first
      try {
        const response = await apiRequest("POST", "/api/v1/auth/dev-token", {
          userId,
          email,
          subscriptionTier,
          subscriptionStatus: 'active',
        });

        const data = await response.json();

        if (data.token) {
          login(data.token);
          toast({
            title: "Login Successful",
            description: `Logged in as ${email}`,
          });
          setLocation("/projects");
          return;
        }
      } catch (apiError) {
        console.warn("Backend login failed, falling back to mock auth:", apiError);

        // Fallback to mock auth
        const { generateMockToken } = await import("@/lib/mockAuth");
        const mockToken = generateMockToken({
          userId,
          email,
          subscriptionTier,
          subscriptionStatus: 'active',
        });

        login(mockToken);
        toast({
          title: "Dev Mode Login",
          description: `Logged in as ${email} (Mock Mode)`,
        });
        setLocation("/projects");
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">ORION Development Login</CardTitle>
          <CardDescription className="text-center">
            Test authentication for development purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="text"
              placeholder="user-123"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              data-testid="input-userid"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier">Subscription Tier</Label>
            <Select value={subscriptionTier} onValueChange={(value: any) => setSubscriptionTier(value)}>
              <SelectTrigger id="tier" data-testid="select-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full"
            data-testid="button-login"
          >
            Generate Token & Login
          </Button>

          <div className="text-xs text-muted-foreground mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <strong>Note:</strong> This is a development-only login page. In production, users will authenticate through your Wix website, and the token will be passed automatically via iframe postMessage.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
