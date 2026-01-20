import { useState } from "react";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFindingComments, useAddComment, useDeleteComment } from "@/hooks/useFindingComments";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface FindingCommentsProps {
  findingId: string;
  currentUserId?: string;
}

export function FindingComments({ findingId, currentUserId }: FindingCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const { data: comments, isLoading } = useFindingComments(findingId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    await addComment.mutateAsync({ findingId, content: newComment });
    setNewComment("");
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment.mutateAsync({ commentId, findingId });
  };

  // Extract initials from email
  const getInitials = (email: string) => {
    const parts = email.split('@')[0];
    return parts.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Comments {comments && comments.length > 0 && `(${comments.length})`}
        </h4>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              className={cn(
                "flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50",
                comment.user_id === currentUserId && "bg-primary/5 border-primary/20"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                {getInitials(comment.user_email || '')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground truncate">
                    {comment.user_email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
              {comment.user_id === currentUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-6 w-6 opacity-60 hover:opacity-100 hover:text-destructive"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleteComment.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to add one.
          </p>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[60px] resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!newComment.trim() || addComment.isPending}
          className="shrink-0 self-end"
        >
          {addComment.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Press Cmd/Ctrl + Enter to submit
      </p>
    </div>
  );
}
