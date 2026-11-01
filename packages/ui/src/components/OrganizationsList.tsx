import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const OrganizationsList = () => {
  const { data: organizations, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiClient<any[]>('/api/organizations'),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return null;
  }

  return (
    <div className="py-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Organizations
          </span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explore creative communities and their collections
        </p>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <Link key={org.id} to={`/org/${org.slug}`}>
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl">{org.name}</CardTitle>
                <CardDescription>@{org.slug}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OrganizationsList;
