import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NotFoundPage() {
  return (
    <div className="flex-1 p-8 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-4xl font-bold mb-2">404</CardTitle>
          <p className="text-muted-foreground">Page Not Found</p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild>
            <Link to="/plants" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go to Plants
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

