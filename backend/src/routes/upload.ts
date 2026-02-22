import { Router, Response } from 'express';
import path from 'path';
import { uploadProductImage, handleUploadError } from '../middleware/upload';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireManager); // Seuls les managers peuvent uploader des images

// Upload d'une image de produit
router.post(
  '/product-image',
  uploadProductImage.single('image'),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Aucun fichier fourni' });
        return;
      }

      // Retourner l'URL relative de l'image
      // Le serveur sert les fichiers statiques via /images (voir server.ts)
      const imageUrl = `/images/products/${req.file.filename}`;
      
      res.json({
        imageUrl,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({ error: 'Erreur lors de l\'upload de l\'image' });
    }
  }
);

export default router;
