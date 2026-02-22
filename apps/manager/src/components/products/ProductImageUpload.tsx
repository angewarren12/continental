import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, IconButton, Alert } from '@mui/material';
import { Camera, Image as ImageIcon, Delete } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { uploadProductImage } from '@shared/api/upload';

interface ProductImageUploadProps {
  value?: string;
  onChange: (imageUrl: string | null) => void;
  error?: string;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({ value, onChange, error }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('L\'image est trop volumineuse (max 5MB)');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const response = await uploadProductImage(file);
      onChange(response.imageUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        });

        if (image.dataUrl) {
          // Convertir dataUrl en File
          const response = await fetch(image.dataUrl);
          const blob = await response.blob();
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          await handleFileSelect(file);
        }
      } catch (err) {
        setUploadError('Erreur lors de la capture photo');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImageUrl = () => {
    if (!value) return null;
    if (value.startsWith('http')) return value;
    // Si c'est un chemin relatif, construire l'URL complète
    // Les images sont servies directement depuis le serveur, pas via /api
    const BASE_URL = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') // Enlever /api si présent
      : 'http://localhost:3002';
    // Le backend retourne /images/products/... (le serveur sert via /images)
    const fullUrl = `${BASE_URL}${value}`;
    console.log('[ProductImageUpload] Image URL:', { value, fullUrl, BASE_URL });
    return fullUrl;
  };

  const imageUrl = getImageUrl();
  
  // Log pour déboguer
  useEffect(() => {
    if (value) {
      console.log('[ProductImageUpload] Value changed:', value);
    }
  }, [value]);

  return (
    <Box>
      <AnimatePresence>
        {imageUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 300,
                margin: '0 auto',
                borderRadius: 2,
                overflow: 'hidden',
                border: '2px solid',
                borderColor: 'primary.main',
              }}
            >
              <img
                src={imageUrl}
                alt="Produit"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
              <IconButton
                onClick={handleRemove}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' },
                }}
                size="small"
              >
                <Delete />
              </IconButton>
            </Box>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: 'grey.50',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'grey.100',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cliquez pour sélectionner une image
              </Typography>
              <Typography variant="caption" color="text.secondary">
                JPG, PNG ou WebP (max 5MB)
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ImageIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Galerie
                </Button>
                {Capacitor.isNativePlatform() && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Camera />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCameraCapture();
                    }}
                  >
                    Caméra
                  </Button>
                )}
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {uploading && (
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Upload en cours...
          </Typography>
        </Box>
      )}

      {(error || uploadError) && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error || uploadError}
        </Alert>
      )}
    </Box>
  );
};

export default ProductImageUpload;
