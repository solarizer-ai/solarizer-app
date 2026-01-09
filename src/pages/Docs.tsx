import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Code, Shield, Zap, AlertTriangle, CheckCircle } from "lucide-react";

const Docs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Documentation</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Learn how to use Solarizer for smart contract security auditing
            </p>
          </div>

          <Tabs defaultValue="getting-started" className="space-y-6">
            <TabsList>
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
              <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
            </TabsList>

            <TabsContent value="getting-started" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Quick Start Guide
                  </CardTitle>
                  <CardDescription>
                    Get started with Solarizer in minutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Upload Your Contract</h4>
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your .sol files or paste your Solidity code directly into the editor.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Start Analysis</h4>
                        <p className="text-sm text-muted-foreground">
                          Click "Start Analysis" to begin the automated security scan of your contract.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Review Findings</h4>
                        <p className="text-sm text-muted-foreground">
                          Examine the detailed security report with vulnerability descriptions and remediation guides.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Export Report</h4>
                        <p className="text-sm text-muted-foreground">
                          Download your security report as a PDF for documentation and sharing.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security Grades
                  </CardTitle>
                  <CardDescription>
                    Understanding your security score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                      { grade: 'A', range: '85-100%', desc: 'Excellent security posture' },
                      { grade: 'B', range: '70-84%', desc: 'Good with minor issues' },
                      { grade: 'C', range: '60-69%', desc: 'Moderate vulnerabilities' },
                      { grade: 'D', range: '50-59%', desc: 'Significant concerns' },
                      { grade: 'F', range: '0-49%', desc: 'Critical issues found' },
                    ].map((item) => (
                      <div key={item.grade} className="text-center p-4 rounded-lg bg-muted/50">
                        <div className={`text-2xl font-bold ${
                          item.grade === 'A' || item.grade === 'B' ? 'text-success' :
                          item.grade === 'C' ? 'text-warning' : 'text-destructive'
                        }`}>
                          {item.grade}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{item.range}</div>
                        <div className="text-xs mt-2">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vulnerabilities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Common Vulnerabilities
                  </CardTitle>
                  <CardDescription>
                    Security issues Solarizer detects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'Reentrancy', severity: 'Critical', desc: 'External calls that allow recursive function invocation before state updates.' },
                    { name: 'Integer Overflow/Underflow', severity: 'High', desc: 'Arithmetic operations that exceed variable bounds.' },
                    { name: 'Access Control', severity: 'High', desc: 'Missing or improper authorization checks on sensitive functions.' },
                    { name: 'Unchecked External Calls', severity: 'Medium', desc: 'External calls without proper return value validation.' },
                    { name: 'Front-Running', severity: 'Medium', desc: 'Transaction ordering manipulation vulnerabilities.' },
                  ].map((vuln) => (
                    <div key={vuln.name} className="flex items-start gap-4 p-4 rounded-lg border border-border">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        vuln.severity === 'Critical' ? 'bg-critical/10 text-critical' :
                        vuln.severity === 'High' ? 'bg-destructive/10 text-destructive' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {vuln.severity}
                      </div>
                      <div>
                        <h4 className="font-medium">{vuln.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{vuln.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="best-practices" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    Security Best Practices
                  </CardTitle>
                  <CardDescription>
                    Recommended patterns for secure smart contracts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: 'Use Checks-Effects-Interactions', desc: 'Always update state before making external calls to prevent reentrancy.' },
                    { title: 'Implement Access Control', desc: 'Use OpenZeppelin\'s Ownable or AccessControl for role-based permissions.' },
                    { title: 'Validate All Inputs', desc: 'Check for zero addresses, valid ranges, and expected values in all functions.' },
                    { title: 'Use SafeMath (pre-0.8)', desc: 'For Solidity versions before 0.8, use SafeMath for arithmetic operations.' },
                    { title: 'Emit Events', desc: 'Log all important state changes for transparency and off-chain tracking.' },
                    { title: 'Regular Audits', desc: 'Schedule periodic security reviews, especially before major releases.' },
                  ].map((practice, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">{practice.title}</h4>
                        <p className="text-sm text-muted-foreground">{practice.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    Secure Pattern Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
{`// Secure withdrawal pattern
function withdraw(uint256 amount) external nonReentrant {
    // 1. Checks
    require(balances[msg.sender] >= amount, "Insufficient");
    
    // 2. Effects (state change FIRST)
    balances[msg.sender] -= amount;
    
    // 3. Interactions (external call LAST)
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
    
    emit Withdrawal(msg.sender, amount);
}`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Docs;
