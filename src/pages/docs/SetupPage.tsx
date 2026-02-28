import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const SetupPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Getting Started</h2>
      <p className="text-sm text-muted-foreground mt-1">Get up and running in under 2 minutes</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Quick Start
        </CardTitle>
        <CardDescription>Follow these steps to start your first security audit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">1</span>
            </div>
            <div>
              <h4 className="font-medium">Create Your Account</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Sign up at <strong className="text-foreground">solarizer.io</strong> to create your account and access the dashboard.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">2</span>
            </div>
            <div>
              <h4 className="font-medium">Choose a Plan</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Subscribe to a plan — <strong className="text-foreground">Spark</strong>, <strong className="text-foreground">Blaze</strong>, or <strong className="text-foreground">Inferno</strong> — to unlock the analysis engine. Each plan includes 50 monthly credits.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">3</span>
            </div>
            <div>
              <h4 className="font-medium">Start Your First Audit</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Click <strong className="text-foreground">New Audit</strong> from the dashboard, upload your Solidity contracts, and follow the guided wizard to begin your security analysis.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default SetupPage;
