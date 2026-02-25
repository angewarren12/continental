import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Paper,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ProductSupplement } from '@shared/types/product';

interface DishSupplementsManagerProps {
  supplements: ProductSupplement[];
  onChange: (supplements: ProductSupplement[]) => void;
}

const DishSupplementsManager: React.FC<DishSupplementsManagerProps> = ({
  supplements,
  onChange,
}) => {
  const [newSupplement, setNewSupplement] = useState({ supplement_name: '', supplement_price: 0 });

  const handleAddSupplement = () => {
    if (!newSupplement.supplement_name.trim() || newSupplement.supplement_price <= 0) {
      return;
    }

    const supplement: ProductSupplement = {
      supplement_name: newSupplement.supplement_name.trim(),
      supplement_price: newSupplement.supplement_price,
    };

    onChange([...supplements, supplement]);
    setNewSupplement({ supplement_name: '', supplement_price: 0 });
  };

  const handleRemoveSupplement = (index: number) => {
    const updated = supplements.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdateSupplement = (index: number, field: 'supplement_name' | 'supplement_price', value: string | number) => {
    const updated = [...supplements];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000', mb: 2 }}>
        Suppléments pour ce plat
      </Typography>

      {/* Liste des suppléments existants */}
      {supplements.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {supplements.map((supplement, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                mb: 1,
                backgroundColor: '#F9F9F9',
                borderRadius: 2,
                position: 'relative',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nom du supplément"
                  value={supplement.supplement_name}
                  onChange={(e) => handleUpdateSupplement(index, 'supplement_name', e.target.value)}
                  sx={{ flex: 1, mr: 1 }}
                />
                <IconButton
                  onClick={() => handleRemoveSupplement(index)}
                  sx={{
                    color: '#DC143C',
                    '&:hover': {
                      backgroundColor: 'rgba(220, 20, 60, 0.1)',
                    },
                    mt: 0.5,
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Prix"
                type="number"
                value={supplement.supplement_price}
                onChange={(e) => handleUpdateSupplement(index, 'supplement_price', parseFloat(e.target.value) || 0)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
                }}
              />
            </Paper>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Formulaire pour ajouter un nouveau supplément */}
      <Box>
        <TextField
          fullWidth
          size="small"
          label="Nom du supplément"
          value={newSupplement.supplement_name}
          onChange={(e) => setNewSupplement({ ...newSupplement, supplement_name: e.target.value })}
          placeholder="Ex: Œuf préparé"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddSupplement();
            }
          }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            size="small"
            label="Prix"
            type="number"
            value={newSupplement.supplement_price}
            onChange={(e) => setNewSupplement({ ...newSupplement, supplement_price: parseFloat(e.target.value) || 0 })}
            InputProps={{
              endAdornment: <InputAdornment position="end">FCFA</InputAdornment>,
            }}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleAddSupplement}
            disabled={!newSupplement.supplement_name.trim() || newSupplement.supplement_price < 0}
            sx={{
              backgroundColor: '#9C27B0',
              color: '#FFFFFF',
              minWidth: 100,
              '&:hover': {
                backgroundColor: '#7B1FA2',
              },
              '&:disabled': {
                backgroundColor: '#CCCCCC',
              },
            }}
            startIcon={<AddIcon />}
          >
            Ajouter
          </Button>
        </Box>
      </Box>

      {supplements.length === 0 && (
        <Typography variant="caption" sx={{ color: '#666666', mt: 1, display: 'block' }}>
          Aucun supplément ajouté. Cliquez sur "Ajouter" pour en créer un.
        </Typography>
      )}
    </Box>
  );
};

export default DishSupplementsManager;
