
import React from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface BusinessTabProps {
  user: User;
}

const BusinessTab: React.FC<BusinessTabProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Enter details about your company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" placeholder="Company Name" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Your Role</Label>
              <Input id="role" placeholder="e.g. Sales Manager" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" placeholder="Industry" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size</Label>
              <Input id="companySize" placeholder="Number of employees" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Company Website</Label>
              <Input id="website" type="url" placeholder="https://company-website.com" />
            </div>
            
            <Button className="w-full md:w-auto">Save Company Information</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
          <CardDescription>Enter your business address details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="streetAddress">Street Address</Label>
              <Input id="streetAddress" placeholder="Street Address" />
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="City" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input id="state" placeholder="State/Province" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip/Postal Code</Label>
                <Input id="zipCode" placeholder="Zip/Postal Code" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="Country" />
            </div>
            
            <Button className="w-full md:w-auto">Save Address</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessTab;
