'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, RotateCcw, Check, X, Loader2 } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin akses kamera.')
    } finally {
      setIsLoading(false)
    }
  }, [facingMode, stream])

  useEffect(() => {
    startCamera()
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (facingMode && !capturedImage) {
      startCamera()
    }
  }, [facingMode])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Flip horizontally for selfie camera
    if (facingMode === 'user') {
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
    }
    
    context.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageData)
    
    // Stop the stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage)
    }
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    onCancel()
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[4/3] bg-muted">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={startCamera}>
                Coba Lagi
              </Button>
            </div>
          )}

          {!error && !capturedImage && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              onLoadedMetadata={() => setIsLoading(false)}
            />
          )}

          {capturedImage && (
            <img 
              src={capturedImage || "/placeholder.svg"} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay guide */}
          {!capturedImage && !error && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-dashed border-primary-foreground/50 rounded-full" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-muted/50">
          {!capturedImage ? (
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCancel}
              >
                <X className="h-5 w-5" />
              </Button>
              
              <Button 
                size="lg"
                className="rounded-full w-16 h-16"
                onClick={capturePhoto}
                disabled={isLoading || !!error}
              >
                <Camera className="h-6 w-6" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={toggleCamera}
                disabled={isLoading}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline"
                onClick={retakePhoto}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Ulangi
              </Button>
              
              <Button onClick={confirmPhoto}>
                <Check className="h-4 w-4 mr-2" />
                Gunakan Foto
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
