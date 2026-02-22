import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Chip, Typography } from '@mui/material';
import { Category } from '@shared/types/category';

interface CategorySelectorProps {
  categories: Category[];
  value?: number | null;
  onChange: (categoryId: number | null) => void;
  error?: boolean;
  helperText?: string;
  label?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  value,
  onChange,
  error,
  helperText,
  label = 'Catégorie',
}) => {
  return (
    <FormControl fullWidth error={error}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        label={label}
        renderValue={(selected) => {
          if (!selected) return '';
          const category = categories.find((c) => c.id === selected);
          if (!category) return '';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {category.icon && (
                <Chip
                  label={category.name}
                  size="small"
                  sx={{
                    bgcolor: category.color,
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              )}
              {!category.icon && category.name}
            </Box>
          );
        }}
      >
        <MenuItem value="">
          <em>Aucune catégorie</em>
        </MenuItem>
        {categories
          .filter((cat) => cat.isActive)
          .map((category) => (
            <MenuItem key={category.id} value={category.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {category.icon && (
                  <Chip
                    label={category.name}
                    size="small"
                    sx={{
                      bgcolor: category.color,
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                )}
                {!category.icon && category.name}
              </Box>
            </MenuItem>
          ))}
      </Select>
      {helperText && (
        <Box sx={{ mt: 0.5, ml: 1.5 }}>
          <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>
            {helperText}
          </Typography>
        </Box>
      )}
    </FormControl>
  );
};

export default CategorySelector;
