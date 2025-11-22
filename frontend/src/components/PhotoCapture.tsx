import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

interface PhotoCaptureProps {
  onCapture: (imageBase64: string) => void;
  onCancel: () => void;
}

export function PhotoCapture({ onCapture, onCancel }: PhotoCaptureProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, etc.)");
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    if (selectedImage) {
      onCapture(selectedImage);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 sm:px-6 py-8 bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="space-y-6 pt-6">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload plant photo"
          />

          {/* Upload area or image preview */}
          {!selectedImage ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="rounded-full bg-muted p-8 shadow-inner">
                <Upload className="size-16 text-muted-foreground" />
              </div>
              <div className="text-center space-y-3 px-4">
                <h2 className="text-xl sm:text-2xl font-bold">Upload Your Photo</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Take a photo of the plant you found
                </p>
              </div>
              <Button
                size="lg"
                className="min-h-[56px] px-8 text-base sm:text-lg font-semibold gap-3 hover:scale-[1.02] transition-all"
                onClick={handleUploadClick}
              >
                <Upload className="size-5 sm:size-6" />
                Upload Photo
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-bold">Photo Preview</h2>
              </div>
              <div className="relative bg-muted/30 rounded-lg p-2 border border-border">
                <img
                  src={selectedImage}
                  alt="Captured plant"
                  className="w-full max-h-[300px] sm:max-h-[400px] object-contain rounded-md"
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pb-6 px-6">
          {selectedImage ? (
            <>
              <Button
                size="lg"
                className="w-full min-h-[56px] text-base sm:text-lg font-semibold hover:scale-[1.02] transition-all"
                onClick={handleSubmit}
              >
                Submit Photo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full min-h-[48px] text-base font-medium"
                onClick={handleUploadClick}
              >
                Choose Different Photo
              </Button>
            </>
          ) : null}
          <Button
            variant="ghost"
            size="lg"
            className="w-full min-h-[48px] text-base gap-2"
            onClick={onCancel}
          >
            <X className="size-5" />
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
