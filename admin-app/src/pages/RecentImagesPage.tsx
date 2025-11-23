import { useEffect, useState } from 'react';
import { getRecentImages, type RecentImagesResponse } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { useSettings } from '@/contexts/SettingsContext';
import { Image as ImageIcon } from 'lucide-react';

export function RecentImagesPage() {
  const { settings } = useSettings();
  const [images, setImages] = useState<RecentImagesResponse['images']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getRecentImages(50, settings.apiBaseUrl);
        setImages(response.images);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recent images');
        console.error('Error fetching recent images:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [settings.apiBaseUrl]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading recent images...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Error loading images</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Recent Images
        </h1>
        <p className="text-muted-foreground">
          View recently uploaded plant images from users ({images.length} total)
        </p>
      </div>

      {images.length === 0 ? (
        <Card className="p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">No images found</p>
          <p className="text-muted-foreground">
            Images uploaded by users will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {images.map((image) => {
            const plant = image.plants;
            return (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  {image.image_url ? (
                    <img
                      src={image.image_url}
                      alt={plant?.common_name || plant?.scientific_name || 'Plant image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex items-center justify-center h-full text-muted-foreground">
                              <ImageIcon class="h-8 w-8" />
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  {image.is_main_image && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Main
                    </div>
                  )}
                </div>
                <div className="p-2 space-y-1">
                  {plant && (
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" title={plant.common_name || 'Unknown'}>
                        {plant.common_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate italic" title={plant.scientific_name}>
                        {plant.scientific_name}
                      </p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground pt-1 border-t">
                    <div className="truncate" title={formatDate(image.uploaded_at)}>
                      {formatDate(image.uploaded_at)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

