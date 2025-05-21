
import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface BusinessDetailsFormValues {
  companyName: string;
  role: string;
  industry: string;
  companySize: string;
  website: string;
}

interface AddressFormValues {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface BusinessTabProps {
  user: User;
}

const BusinessTab: React.FC<BusinessTabProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const businessForm = useForm<BusinessDetailsFormValues>({
    defaultValues: {
      companyName: "",
      role: "",
      industry: "",
      companySize: "",
      website: "",
    },
  });

  const addressForm = useForm<AddressFormValues>({
    defaultValues: {
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  // Fetch existing business details
  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('business_details')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching business details:", error.message);
          return;
        }
        
        if (data) {
          businessForm.reset({
            companyName: data.company_name || "",
            role: data.role || "",
            industry: data.industry || "",
            companySize: data.company_size || "",
            website: data.website || "",
          });
          
          addressForm.reset({
            streetAddress: data.street_address || "",
            city: data.city || "",
            state: data.state || "",
            zipCode: data.zip_code || "",
            country: data.country || "",
          });
        }
      } catch (error: any) {
        console.error("Error:", error.message);
      }
    };
    
    fetchBusinessDetails();
  }, [user.id, businessForm, addressForm]);

  // Save business information
  const onSaveBusinessInfo = async (values: BusinessDetailsFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('business_details')
        .upsert({
          id: user.id,
          company_name: values.companyName,
          role: values.role,
          industry: values.industry,
          company_size: values.companySize,
          website: values.website,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      toast.success("Company information updated successfully");
    } catch (error: any) {
      toast.error("Error updating company information: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save address information
  const onSaveAddress = async (values: AddressFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('business_details')
        .upsert({
          id: user.id,
          street_address: values.streetAddress,
          city: values.city,
          state: values.state,
          zip_code: values.zipCode,
          country: values.country,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      toast.success("Address information updated successfully");
    } catch (error: any) {
      toast.error("Error updating address information: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Enter details about your company</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...businessForm}>
            <form onSubmit={businessForm.handleSubmit(onSaveBusinessInfo)} className="space-y-4">
              <FormField
                control={businessForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={businessForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sales Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={businessForm.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Industry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={businessForm.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <FormControl>
                      <Input placeholder="Number of employees" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={businessForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Website</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://company-website.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Company Information"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
          <CardDescription>Enter your business address details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...addressForm}>
            <form onSubmit={addressForm.handleSubmit(onSaveAddress)} className="space-y-4">
              <FormField
                control={addressForm.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={addressForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addressForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="State/Province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addressForm.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip/Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Zip/Postal Code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addressForm.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Address"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessTab;
