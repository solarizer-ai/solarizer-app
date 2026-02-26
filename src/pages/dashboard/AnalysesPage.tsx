import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuditCard from "@/components/AuditCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, FileCode, Trash2, Plus } from "lucide-react";
import { useAudits, useDeleteAudit } from "@/hooks/useAudits";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AnalysesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: audits, isLoading } = useAudits();
  const deleteAudit = useDeleteAudit();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownershipFilter, setOwnershipFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [deleteAuditId, setDeleteAuditId] = useState<string | null>(null);

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const handleDeleteAudit = async () => {
    if (!deleteAuditId) return;
    try {
      await deleteAudit.mutateAsync(deleteAuditId);
      toast({ title: "Audit deleted", description: "The audit has been permanently removed." });
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to delete", description: "Please try again." });
    } finally {
      setDeleteAuditId(null);
    }
  };

  const filteredAudits = audits?.filter(audit => {
    const matchesSearch = audit.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || audit.status === statusFilter;
    const isOwned = audit.user_id === user?.id;
    const matchesOwnership =
      ownershipFilter === "all" ||
      (ownershipFilter === "owned" && isOwned) ||
      (ownershipFilter === "shared" && !isOwned);
    return matchesSearch && matchesStatus && matchesOwnership;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "name": return a.project_name.localeCompare(b.project_name);
      case "grade":
        const gradeOrder: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, F: 5 };
        return (a.grade ? gradeOrder[a.grade] : 6) - (b.grade ? gradeOrder[b.grade] : 6);
      default: return 0;
    }
  });

  const hasSharedAudits = audits?.some(a => a.user_id !== user?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-2xl font-semibold text-foreground">History</h2>
          <p className="text-sm text-muted-foreground mt-1">{audits?.length || 0} security assessments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px] sm:w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="secured">Secured</SelectItem>
              <SelectItem value="issues">Issues</SelectItem>
              <SelectItem value="analyzing">Analyzing</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          {hasSharedAudits && (
            <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
              <SelectTrigger className="w-[110px] sm:w-[140px]"><SelectValue placeholder="Ownership" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audits</SelectItem>
                <SelectItem value="owned">My Audits</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[110px] sm:w-[130px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="grade">Best Grade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audit Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredAudits && filteredAudits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAudits.map((audit) => {
            const isOwned = audit.user_id === user?.id;
            return (
              <div key={audit.id} className="relative group">
                <AuditCard
                  projectName={audit.project_name}
                  contractCount={audit.contract_count}
                  grade={audit.grade || undefined}
                  status={audit.status}
                  timestamp={formatTimestamp(audit.created_at)}
                  onClick={() => navigate(`/reports/${audit.id}`)}
                  isShared={!isOwned}
                  hasShares={isOwned && (audit.share_count || 0) > 0}
                />
                {isOwned && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteAuditId(audit.id); }}
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <FileCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchQuery || statusFilter !== "all" || ownershipFilter !== "all" ? "No matching assessments" : "No assessments yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all" || ownershipFilter !== "all"
              ? "Try adjusting your filters"
              : "Start your first smart contract security analysis"}
          </p>
        </div>
      )}

      <AlertDialog open={!!deleteAuditId} onOpenChange={() => setDeleteAuditId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this assessment? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAudit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnalysesPage;
