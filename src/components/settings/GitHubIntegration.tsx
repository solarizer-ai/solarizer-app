import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Github, Link2, ExternalLink, Loader2, Check, AlertCircle } from "lucide-react";
import { useGitHubConnection } from "@/hooks/useGitHubConnection";
import { useToast } from "@/hooks/use-toast";
import { invokeWithRefresh } from "@/lib/sessionRefresh";
import { format } from "date-fns";

interface GitHubConfigResponse {
  configured: boolean;
  client_id?: string;
}

export function GitHubIntegration() {
  const { toast } = useToast();
  const { 
    connection, 
    isConnected, 
    isLoading, 
    connect, 
    disconnect, 
    isConnecting, 
    isDisconnecting 
  } = useGitHubConnection();
  
  const [clientId, setClientId] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // Fetch GitHub client ID on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await invokeWithRefresh<GitHubConfigResponse>('github-config', {});
        if (error) throw error;
        
        if (data?.configured && data.client_id) {
          setClientId(data.client_id);
        } else {
          setConfigError("GitHub OAuth is not configured yet.");
        }
      } catch (err) {
        console.error("Failed to fetch GitHub config:", err);
        setConfigError("Failed to load GitHub configuration.");
      } finally {
        setConfigLoading(false);
      }
    };
    
    fetchConfig();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const tab = params.get('tab');
    
    if (code && tab === 'integrations') {
      const redirectUri = `${window.location.origin}/settings?tab=integrations`;
      
      connect({ code, redirectUri })
        .then(() => {
          toast({ title: "GitHub connected successfully!" });
          window.history.replaceState({}, '', '/settings?tab=integrations');
        })
        .catch((err) => {
          toast({ 
            variant: "destructive", 
            title: "Failed to connect GitHub", 
            description: err.message 
          });
          window.history.replaceState({}, '', '/settings?tab=integrations');
        });
    }
  }, [connect, toast]);

  const handleConnectGitHub = () => {
    if (!clientId) return;
    
    const redirectUri = `${window.location.origin}/settings?tab=integrations`;
    const scope = 'repo read:user';
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({ title: "GitHub disconnected" });
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Failed to disconnect", 
        description: err.message 
      });
    }
  };

  if (isLoading || configLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub
              {isConnected && (
                <Badge variant="default" className="ml-2">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isConnected 
                ? "Your GitHub account is connected" 
                : "Connect your GitHub account to access private repositories"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {configError && !isConnected ? (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{configError}</p>
            </div>
          </div>
        ) : isConnected && connection ? (
          <>
            {/* Connected state */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={connection.github_avatar_url || undefined} />
                  <AvatarFallback>
                    <Github className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <a 
                    href={`https://github.com/${connection.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:text-primary flex items-center gap-1"
                  >
                    @{connection.github_username}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-sm text-muted-foreground">
                    Connected on {format(new Date(connection.connected_at), "MMM d, yyyy")}
                  </p>
                  {connection.scopes && connection.scopes.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {connection.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="gap-2"
            >
              {isDisconnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Disconnect
            </Button>
          </>
        ) : (
          <>
            {/* Not connected state */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <ul className="space-y-2 text-sm text-foreground/90">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Access to private repositories
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Higher API rate limits
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Automatic repository discovery
                </li>
              </ul>
            </div>

            <Button 
              onClick={handleConnectGitHub}
              disabled={isConnecting || !clientId}
              className="gap-2"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Github className="w-4 h-4" />
              )}
              Connect GitHub
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
