import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Loader2, Clock } from 'lucide-react';
import { useApiKeys, useGenerateApiKey, useRevokeApiKey, useRevealApiKey } from '@/hooks/useApiKeys';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

const MAX_KEYS = 5;

export function ApiKeyManager() {
  const { data: keys = [], isLoading } = useApiKeys();
  const generateKey = useGenerateApiKey();
  const revokeKey = useRevokeApiKey();
  const revealKey = useRevealApiKey();
  const { toast } = useToast();

  const [keyName, setKeyName] = useState('');
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);

  const activeCount = keys.length;
  const atLimit = activeCount >= MAX_KEYS;

  const handleGenerate = async () => {
    if (!keyName.trim()) return;
    try {
      const result = await generateKey.mutateAsync(keyName.trim());
      setNewlyGeneratedKey(result.key);
      setKeyName('');
      toast({ title: 'API key generated', description: `Key "${keyName.trim()}" created successfully.` });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to generate key', description: 'Please try again.' });
    }
  };

  const handleReveal = async (keyId: string) => {
    if (revealedKeys[keyId]) {
      const updated = { ...revealedKeys };
      delete updated[keyId];
      setRevealedKeys(updated);
      return;
    }
    setRevealingId(keyId);
    try {
      const result = await revealKey.mutateAsync(keyId);
      setRevealedKeys(prev => ({ ...prev, [keyId]: result.key }));
    } catch {
      toast({ variant: 'destructive', title: 'Failed to reveal key', description: 'This key may not support reveal.' });
    } finally {
      setRevealingId(null);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleRevoke = async () => {
    if (!revokeTargetId) return;
    try {
      await revokeKey.mutateAsync(revokeTargetId);
      const updated = { ...revealedKeys };
      delete updated[revokeTargetId];
      setRevealedKeys(updated);
      toast({ title: 'API key revoked' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to revoke key' });
    } finally {
      setRevokeTargetId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Generate and manage your CLI API keys
              </CardDescription>
            </div>
            <Badge variant="secondary">{activeCount} / {MAX_KEYS} active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generate form */}
          <div className="flex gap-2">
            <Input
              placeholder="Key name (e.g. My CLI Key)"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              disabled={atLimit || generateKey.isPending}
            />
            <Button
              onClick={handleGenerate}
              disabled={!keyName.trim() || atLimit || generateKey.isPending}
              className="gap-1.5 shrink-0"
            >
              {generateKey.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate
            </Button>
          </div>

          {atLimit && (
            <p className="text-xs text-muted-foreground">
              Maximum {MAX_KEYS} active keys allowed. Revoke an existing key to create a new one.
            </p>
          )}

          {/* Newly generated key banner */}
          {newlyGeneratedKey && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 space-y-2">
              <p className="text-sm font-medium">New API Key Generated</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono break-all">
                  {newlyGeneratedKey}
                </code>
                <Button size="sm" variant="outline" onClick={() => handleCopy(newlyGeneratedKey)} className="shrink-0 gap-1">
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setNewlyGeneratedKey(null)} className="text-xs">
                Dismiss
              </Button>
            </div>
          )}

          {/* Key list */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No API keys yet. Generate one above to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={k.id} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{k.name || 'Unnamed Key'}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>Created {k.created_at ? format(new Date(k.created_at), 'MMM d, yyyy') : 'N/A'}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {k.last_used_at ? `Used ${formatDistanceToNow(new Date(k.last_used_at), { addSuffix: true })}` : 'Never used'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => setRevokeTargetId(k.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {revealedKeys[k.id] ? (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono break-all">
                        {revealedKeys[k.id]}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(revealedKeys[k.id])} className="shrink-0 gap-1">
                        <Copy className="w-3 h-3" /> Copy
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleReveal(k.id)} className="shrink-0">
                        <EyeOff className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground font-mono max-w-[200px] sm:max-w-none truncate">{k.key_prefix}_••••••••</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReveal(k.id)}
                        disabled={revealingId === k.id}
                        className="gap-1"
                      >
                        {revealingId === k.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                        Reveal
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeTargetId} onOpenChange={(open) => !open && setRevokeTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Any applications using this key will no longer be able to authenticate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
