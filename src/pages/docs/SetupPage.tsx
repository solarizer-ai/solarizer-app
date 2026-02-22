import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{children}</code>
);

const SetupPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Installation & Setup</h2>
      <p className="text-sm text-muted-foreground mt-1">Get up and running in under 2 minutes</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Getting Started
        </CardTitle>
        <CardDescription>Follow these steps to install and authenticate</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">1</span>
            </div>
            <div>
              <h4 className="font-medium">Install the CLI</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Run <Code>npm install -g @solarizer/cli</Code> to install Solarizer globally.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">2</span>
            </div>
            <div>
              <h4 className="font-medium">Launch & Authenticate</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Run <Code>solarizer</Code> and paste your API key when prompted. Alternatively, set the <Code>SOLARIZER_API_KEY</Code> environment variable to skip the prompt.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">3</span>
            </div>
            <div>
              <h4 className="font-medium">You're on the Dashboard</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Navigate with <Code>↑</Code> <Code>↓</Code> arrow keys and select with <Code>Enter</Code>.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default SetupPage;
