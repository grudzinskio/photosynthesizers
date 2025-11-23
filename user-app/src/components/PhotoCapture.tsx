import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import insideDomeImg from "@/assets/inside_dome.webp";

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
    <div className="relative flex min-h-svh flex-col items-center justify-center px-4 sm:px-6 py-8 overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-bottom opacity-60"
        style={{ backgroundImage: `url(${insideDomeImg})` }}
        role="presentation"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-background/40" aria-hidden="true" />
      <Card className="relative z-10 w-full max-w-lg shadow-2xl border-2 border-green-200 dark:border-green-800 bg-card/95 backdrop-blur-sm">
        <CardContent className="space-y-8 pt-8 px-6 sm:px-8">
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
            <div className="flex flex-col items-center justify-center space-y-8 py-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-2xl opacity-30" />
                <div className="relative rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 p-10 shadow-xl border-4 border-green-200 dark:border-green-700">
                  <Upload className="size-20 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-center space-y-4 px-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200">Upload Your Photo</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Take a photo of the plant you found
                </p>
              </div>
              <Button
                size="lg"
                className="min-h-[60px] px-10 text-base sm:text-lg font-bold gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                onClick={handleUploadClick}
              >
                <Upload className="size-6 sm:size-7" />
                Upload Photo
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200">Photo Preview</h2>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-xl p-3 border-4 border-green-200 dark:border-green-800 shadow-xl">
                  <img
                    src={selectedImage}
                    alt="Captured plant"
                    className="w-full max-h-[350px] sm:max-h-[450px] object-contain rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pb-8 px-6 sm:px-8">
          {selectedImage ? (
            <>
              <Button
                size="lg"
                className="w-full min-h-[60px] text-base sm:text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                onClick={handleSubmit}
              >
                Submit Photo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full min-h-[52px] text-base font-semibold border-2 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                onClick={handleUploadClick}
              >
                Choose Different Photo
              </Button>
            </>
          ) : null}
          <Button
            variant="ghost"
            size="lg"
            className="w-full min-h-[52px] text-base gap-2 hover:bg-green-100 dark:hover:bg-green-900"
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
