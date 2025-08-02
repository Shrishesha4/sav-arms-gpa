import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { Badge } from "./ui/badge";

export default function PortalLogin() {
  return (
    <Card className="relative overflow-hidden">
       <Badge variant="destructive" className="absolute top-4 right-4 -rotate-12">Coming Soon!</Badge>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            <span>Portal Login</span>
        </CardTitle>
        <CardDescription>
          For Saveetha University students. Automatically fetch your grades.
        </CardDescription>
      </CardHeader>
      <CardContent className="opacity-50 pointer-events-none">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="Your ARMS username" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Your ARMS password" disabled />
          </div>
          <Button className="w-full" disabled>
            Login & Fetch Grades
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
