import * as React from "react"
import { useState, useRef } from "react"
import { Upload, X, Star, Loader2, Link } from "lucide-react"
import imageCompression from "browser-image-compression"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { ProductImage } from "@/types"

interface ImageUploadProps {
  images: Partial<ProductImage>[]
  onChange: (images: Partial<ProductImage>[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onChange, maxImages = 10 }: ImageUploadProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [urlInput, setUrlInput] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return

    if (images.length >= maxImages) {
      toast({
        title: "Límite alcanzado",
        description: `Solo puedes subir hasta ${maxImages} imágenes`,
        variant: "destructive",
      })
      return
    }

    const newImage: Partial<ProductImage> = {
      url: urlInput.trim(),
      isMain: images.length === 0,
      sortOrder: images.length
    }

    onChange([...images, newImage])
    setUrlInput("")
    setShowUrlInput(false)
    
    toast({
      title: "Imagen añadida",
      description: "La imagen por URL ha sido añadida correctamente",
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (images.length + files.length > maxImages) {
      toast({
        title: "Límite alcanzado",
        description: `Solo puedes subir hasta ${maxImages} imágenes`,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Compress images before upload
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      }

      setUploadProgress(30)
      const compressedFiles = await Promise.all(
        files.map(file => imageCompression(file, compressionOptions))
      )

      setUploadProgress(50)
      const uploadedResults = await api.uploadImages(compressedFiles)

      setUploadProgress(90)
      const newImages: Partial<ProductImage>[] = uploadedResults.map((res, index) => ({
        url: res.url,
        thumbnail: res.thumbnail,
        medium: res.medium,
        large: res.large,
        isMain: images.length === 0 && index === 0,
        sortOrder: images.length + index
      }))

      onChange([...images, ...newImages])
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "Error",
        description: "Error al subir las imágenes",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    const removedImage = newImages.splice(index, 1)[0]
    
    // If we removed the main image, set the first one as main
    if (removedImage.isMain && newImages.length > 0) {
      newImages[0].isMain = true
    }
    
    onChange(newImages)
  }

  const setMainImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isMain: i === index
    }))
    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      {showUrlInput ? (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-dashed animate-in fade-in zoom-in duration-200">
          <Input
            placeholder="Pega la URL de la imagen aquí..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            autoFocus
          />
          <Button onClick={handleUrlSubmit} size="sm">Añadir</Button>
          <Button onClick={() => setShowUrlInput(false)} variant="ghost" size="icon" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            className="text-xs uppercase tracking-wider font-bold h-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivos
          </Button>
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            className="text-xs uppercase tracking-wider font-bold h-9"
            onClick={() => setShowUrlInput(true)}
            disabled={isUploading}
          >
            <Link className="h-4 w-4 mr-2" />
            Desde URL
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <div 
            key={image.url || `img-${index}`} 
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group",
              image.isMain ? "border-primary shadow-md" : "border-border/50 hover:border-primary/50"
            )}
          >
            <img 
              src={image.thumbnail || image.url} 
              alt={`Product ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/200x200/f8fafc/6366f1?text=Error";
                target.onerror = null;
              }}
            />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant={image.isMain ? "default" : "secondary"}
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setMainImage(index)}
                title={image.isMain ? "Imagen principal" : "Establecer como principal"}
              >
                <Star className={cn("h-4 w-4", image.isMain && "fill-current")} />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => removeImage(index)}
                title="Eliminar imagen"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {image.isMain && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                Principal
              </div>
            )}
          </div>
        ))}

        {images.length < maxImages && !showUrlInput && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed border-border/50 bg-background hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-xs font-bold">Subiendo...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8" />
                <span className="text-xs font-bold uppercase tracking-wider">Añadir Fotos</span>
              </>
            )}
          </button>
        )}
      </div>

      {isUploading && uploadProgress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Procesando imágenes</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <p className="text-[11px] text-muted-foreground font-medium italic">
        * Recomendado: Imágenes cuadradas (1:1), formato WebP, JPG o PNG. Máximo 5MB por archivo.
      </p>
    </div>
  )
}
