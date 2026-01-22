import { Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicHeader from "@/components/PublicHeader";
import MinimalFooter from "@/components/MinimalFooter";

const Support = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Contact Support</h1>
          <p className="text-muted-foreground mb-8">
            Get in touch with us for any questions, feedback, or support inquiries.
          </p>

          <div className="grid gap-6">
            {/* Email */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:hello@solarizer.io" 
                  className="text-foreground hover:text-primary transition-colors"
                >
                  hello@solarizer.io
                </a>
              </CardContent>
            </Card>

            {/* Phone */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href="tel:+917506366097" 
                  className="text-foreground hover:text-primary transition-colors"
                >
                  +91 75063 66097
                </a>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  Registered Business Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <address className="not-italic text-foreground leading-relaxed">
                  TF 304, Vinayak Courtyard<br />
                  Raysan, Gandhinagar<br />
                  Gujarat - 382421<br />
                  India
                </address>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-muted-foreground mt-8 text-center">
            © {new Date().getFullYear()} ERYONIX TECHLABS PRIVATE LIMITED
          </p>
        </div>
      </main>

      <MinimalFooter />
    </div>
  );
};

export default Support;
