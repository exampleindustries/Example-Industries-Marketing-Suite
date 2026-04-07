import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login, register, error, loading, clearError } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [localError, setLocalError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!username || !password) {
      setLocalError("Username and password required");
      return;
    }
    await login(username, password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!regUsername || !regEmail || !regPassword || !regDisplayName) {
      setLocalError("All fields are required");
      return;
    }
    if (regPassword.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    if (regPassword !== regConfirm) {
      setLocalError("Passwords do not match");
      return;
    }
    await register(regUsername, regEmail, regPassword, regDisplayName);
  };

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setLocalError("");
    clearError();
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-label="Full Circle Builders logo">
              <circle cx="18" cy="18" r="15" stroke="hsl(218,72%,28%)" strokeWidth="3" className="dark:stroke-[hsl(215,80%,60%)]" fill="none" />
              <path d="M10 22 L10 28 L26 28 L26 22 L18 15 Z" fill="hsl(218,72%,28%)" className="dark:fill-[hsl(215,80%,60%)]" />
              <path d="M8 23 L18 13 L28 23" stroke="hsl(33,95%,50%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">Example Industries Marketing Suite</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your clients and campaigns</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            {/* Tab switcher */}
            <div className="flex rounded-lg bg-secondary p-1">
              <button
                data-testid="tab-login"
                onClick={() => switchMode("login")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogIn size={14} /> Sign In
              </button>
              <button
                data-testid="tab-register"
                onClick={() => switchMode("register")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === "register"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserPlus size={14} /> Register
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {displayError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle size={14} />
                <AlertDescription className="text-sm">{displayError}</AlertDescription>
              </Alert>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs">Username</Label>
                  <Input
                    data-testid="input-login-username"
                    id="username"
                    placeholder="admin"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <div className="relative">
                    <Input
                      data-testid="input-login-password"
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <Button data-testid="button-login" type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Display Name</Label>
                  <Input
                    data-testid="input-reg-display-name"
                    placeholder="Robert Campos"
                    value={regDisplayName}
                    onChange={e => setRegDisplayName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Username</Label>
                    <Input
                      data-testid="input-reg-username"
                      placeholder="rcampos"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input
                      data-testid="input-reg-email"
                      type="email"
                      placeholder="you@email.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Password</Label>
                    <Input
                      data-testid="input-reg-password"
                      type="password"
                      placeholder="6+ characters"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Confirm</Label>
                    <Input
                      data-testid="input-reg-confirm"
                      type="password"
                      placeholder="Repeat password"
                      value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <Button data-testid="button-register" type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
