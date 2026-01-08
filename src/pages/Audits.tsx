import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AuditCard from "@/components/AuditCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2, FileCode, Trash2 } from "lucide-react";
import { useAudits, useDeleteAudit } from "@/hooks/useAudits";
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

const Audits = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: audits, isLoading } = useAudits();
  const deleteAudit = useDeleteAudit();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [deleteAuditId, setDeleteAuditId] = useState<string | null>(null);

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const handleDeleteAudit = async () => {
    if (!deleteAuditId) return;
    
    try {
      await deleteAudit.mutateAsync(deleteAuditId);
      toast({
        title: "Audit deleted",
        description: "The audit has been permanently removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: "Please try again.",
      });
    } finally {
      setDeleteAuditId(null);
    }
  };

  // Filter and sort audits
  const filteredAudits = audits?.filter(audit => {
    const matchesSearch = audit.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || audit.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "name":
        return a.project_name.localeCompare(b.project_name);
      case "grade":
        const gradeOrder = { A: 1, B: 2, C: 3, D: 4, F: 5 };
        const gradeA = a.grade ? gradeOrder[a.grade] : 6;
        const gradeB = b.grade ? gradeOrder[b.grade] : 6;
        return gradeA - gradeB;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">All Audits</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {audits?.length || 0} total audits
              </p>
            </div>
            <Button onClick={() => navigate("/")} className="gap-2">
              <Plus className="w-4 h-4" />
              New Audit
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search audits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="secured">Secured</SelectItem>
                <SelectItem value="issues">Issues</SelectItem>
                <SelectItem value="analyzing">Analyzing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="grade">Best Grade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredAudits && filteredAudits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAudits.map((audit) => (
                <div key={audit.id} className="relative group">
                  <AuditCard
                    projectName={audit.project_name}
                    contractCount={audit.contract_count}
                    grade={audit.grade || undefined}
                    status={audit.status}
                    timestamp={formatTimestamp(audit.created_at)}
                    onClick={() => navigate(`/?audit=${audit.id}`)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteAuditId(audit.id);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-border rounded-lg">
              <FileCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery || statusFilter !== "all" ? "No matching audits" : "No audits yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Start your first smart contract security audit"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => navigate("/")} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Audit
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAuditId} onOpenChange={() => setDeleteAuditId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Audit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this audit? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAudit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Audits;
