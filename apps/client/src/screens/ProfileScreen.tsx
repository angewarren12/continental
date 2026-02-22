import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { updateUser, changePassword } from '@shared/api/users';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!user || !formData.name.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateUser(user.id, {
        name: formData.name,
        email: formData.email || null,
      });
      await refreshUser();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!user) return;

    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setPasswordLoading(true);

    try {
      await changePassword(user.id, passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setPasswordError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '1.375rem', sm: '1.5rem' }, color: '#000000', mb: 2.5, lineHeight: 1.2 }}>
        Mon profil
      </Typography>

      <Paper
        sx={{
          p: 3,
          maxWidth: 600,
          mx: 'auto',
          borderRadius: 2,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Avatar Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: '#bd0f3b',
              color: '#FFFFFF',
              fontSize: '2rem',
              fontWeight: 700,
              border: '3px solid #FFFFFF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            {user?.name ? getInitials(user.name) : 'U'}
          </Avatar>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              backgroundColor: '#FFEBEE',
              border: '1px solid rgba(220, 20, 60, 0.3)',
              borderRadius: 1.5,
              color: '#DC143C',
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              backgroundColor: '#E8F5E9',
              border: '1px solid rgba(46, 125, 50, 0.3)',
              borderRadius: 1.5,
              color: '#2E7D32',
            }}
            onClose={() => setSuccess(false)}
          >
            Profil mis à jour avec succès
          </Alert>
        )}

        <TextField
          fullWidth
          label="Nom"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          margin="normal"
          required
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              '& fieldset': {
                borderColor: '#E0E0E0',
              },
              '&:hover fieldset': {
                borderColor: '#bd0f3b',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#bd0f3b',
              },
            },
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: '#bd0f3b',
              },
            },
          }}
        />

        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          margin="normal"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              '& fieldset': {
                borderColor: '#E0E0E0',
              },
              '&:hover fieldset': {
                borderColor: '#bd0f3b',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#bd0f3b',
              },
            },
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: '#bd0f3b',
              },
            },
          }}
        />

        <TextField
          fullWidth
          label="Téléphone"
          value={user?.phoneNumber || ''}
          margin="normal"
          disabled
          helperText="Le numéro de téléphone ne peut pas être modifié"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              backgroundColor: '#F5F5F5',
            },
            '& .MuiFormHelperText-root': {
              fontSize: '0.75rem',
              color: '#666666',
            },
          }}
        />

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
            sx={{
              backgroundColor: '#bd0f3b',
              color: '#FFFFFF',
              borderRadius: 2,
              padding: { xs: '12px 20px', sm: '14px 24px' },
              fontWeight: 700,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              boxShadow: '0 4px 12px rgba(189, 15, 59, 0.3)',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#e01a4f',
                boxShadow: '0 6px 16px rgba(189, 15, 59, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                backgroundColor: '#CCCCCC',
                opacity: 0.6,
              },
              transition: 'all 300ms ease-in-out',
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Enregistrer les modifications'}
          </Button>
        </Box>
      </Paper>

      {/* Section Changement de mot de passe */}
      <Paper
        sx={{
          p: 3,
          maxWidth: 600,
          mx: 'auto',
          mt: 3,
          borderRadius: 2,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            color: '#000000',
            mb: 2.5,
          }}
        >
          Changer le mot de passe
        </Typography>

        {passwordError && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              backgroundColor: '#FFEBEE',
              border: '1px solid rgba(220, 20, 60, 0.3)',
              borderRadius: 1.5,
              color: '#DC143C',
            }}
            onClose={() => setPasswordError(null)}
          >
            {passwordError}
          </Alert>
        )}

        {passwordSuccess && (
          <Alert
            severity="success"
            sx={{
              mb: 2,
              backgroundColor: '#E8F5E9',
              border: '1px solid rgba(46, 125, 50, 0.3)',
              borderRadius: 1.5,
              color: '#2E7D32',
            }}
            onClose={() => setPasswordSuccess(false)}
          >
            Mot de passe modifié avec succès
          </Alert>
        )}

        <TextField
          fullWidth
          label="Mot de passe actuel"
          type={showPasswords.current ? 'text' : 'password'}
          value={passwordData.currentPassword}
          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
          margin="normal"
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  edge="end"
                >
                  {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              '& fieldset': {
                borderColor: '#E0E0E0',
              },
              '&:hover fieldset': {
                borderColor: '#bd0f3b',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#bd0f3b',
              },
            },
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: '#bd0f3b',
              },
            },
          }}
        />

        <TextField
          fullWidth
          label="Nouveau mot de passe"
          type={showPasswords.new ? 'text' : 'password'}
          value={passwordData.newPassword}
          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          margin="normal"
          required
          helperText="Minimum 6 caractères"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  edge="end"
                >
                  {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              '& fieldset': {
                borderColor: '#E0E0E0',
              },
              '&:hover fieldset': {
                borderColor: '#bd0f3b',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#bd0f3b',
              },
            },
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: '#bd0f3b',
              },
            },
            '& .MuiFormHelperText-root': {
              fontSize: '0.75rem',
              color: '#666666',
            },
          }}
        />

        <TextField
          fullWidth
          label="Confirmer le nouveau mot de passe"
          type={showPasswords.confirm ? 'text' : 'password'}
          value={passwordData.confirmPassword}
          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          margin="normal"
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  edge="end"
                >
                  {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              '& fieldset': {
                borderColor: '#E0E0E0',
              },
              '&:hover fieldset': {
                borderColor: '#bd0f3b',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#bd0f3b',
              },
            },
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: '#bd0f3b',
              },
            },
          }}
        />

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={handlePasswordSubmit}
            disabled={passwordLoading}
            fullWidth
            sx={{
              backgroundColor: '#bd0f3b',
              color: '#FFFFFF',
              borderRadius: 2,
              padding: { xs: '12px 20px', sm: '14px 24px' },
              fontWeight: 700,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              boxShadow: '0 4px 12px rgba(189, 15, 59, 0.3)',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#e01a4f',
                boxShadow: '0 6px 16px rgba(189, 15, 59, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                backgroundColor: '#CCCCCC',
                opacity: 0.6,
              },
              transition: 'all 300ms ease-in-out',
            }}
          >
            {passwordLoading ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Changer le mot de passe'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfileScreen;
