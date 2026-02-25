import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Close, Visibility, VisibilityOff, Restaurant } from '@mui/icons-material';
import {
  signInWithPhoneAndPassword,
  signUpWithPhoneAndPassword,
} from '@shared/api/auth';
import { UserRole } from '@shared/types/user';
import { useAuth } from '../contexts/AuthContext';
import { slideUp } from '../constants/animations';
import { shakeAnimation } from '../utils/animations';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async () => {
    if (!phoneNumber.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      triggerShake();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signInWithPhoneAndPassword(phoneNumber, password);
      await refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!phoneNumber.trim() || !password.trim() || !name.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      triggerShake();
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      triggerShake();
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await signUpWithPhoneAndPassword(
        phoneNumber,
        password,
        name.trim(),
        'manager' as UserRole
      );
      await refreshUser();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#000000', // Noir
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Gradients */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          opacity: 0.2,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: 'rgba(189, 15, 59, 0.1)',
            filter: 'blur(120px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            background: 'rgba(189, 15, 59, 0.05)',
            filter: 'blur(100px)',
          }}
        />
      </Box>

      {/* Header */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
        }}
      >
        <IconButton
          onClick={() => navigate('/onboarding')}
          sx={{
            color: '#F5F5F5',
            '&:hover': {
              opacity: 0.7,
              backgroundColor: 'transparent',
            },
          }}
        >
          <Close />
        </IconButton>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              fontWeight: 300,
              color: '#bd0f3b',
              mb: 0.5,
            }}
          >
            The
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#F5F5F5',
            }}
          >
            Continental
          </Typography>
        </Box>
        <Box sx={{ width: 48 }} />
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 4,
        }}
      >
        {/* Welcome Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ width: '100%', maxWidth: '400px', textAlign: 'center', mb: 5 }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: '2.5rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#F5F5F5',
                mb: 1,
              }}
            >
              Welcome back
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#6B7280',
                fontSize: '1.125rem',
                fontWeight: 300,
              }}
            >
              Membership Login
            </Typography>
          </Box>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <Box sx={{ space: 1.5 }}>
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={shake ? shakeAnimation : { opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert
                    severity="error"
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(189, 15, 59, 0.1)',
                      color: '#bd0f3b',
                      border: '1px solid rgba(189, 15, 59, 0.2)',
                    }}
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <Tabs
              value={tab}
              onChange={(_, newValue) => setTab(newValue)}
              sx={{
                mb: 3,
                '& .MuiTab-root': {
                  color: '#9CA3AF',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                },
                '& .Mui-selected': {
                  color: '#bd0f3b',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#bd0f3b',
                  height: 3,
                  borderRadius: 2,
                },
              }}
            >
              <Tab label="Connexion" />
              <Tab label="Inscription" />
            </Tabs>

            <AnimatePresence mode="wait">
              {tab === 0 && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Email/Phone Input */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#6B7280',
                        fontWeight: 500,
                        mb: 1,
                        pl: 0.5,
                      }}
                    >
                      Numéro de téléphone
                    </Typography>
                    <TextField
                      fullWidth
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0612345678"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(189, 15, 59, 0.05)',
                          borderColor: 'rgba(189, 15, 59, 0.2)',
                          borderRadius: 2,
                          color: '#F5F5F5',
                          '&:hover fieldset': {
                            borderColor: 'rgba(189, 15, 59, 0.3)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#bd0f3b',
                          },
                        },
                        '& .MuiInputBase-input': {
                          py: 2,
                        },
                      }}
                    />
                  </Box>

                  {/* Password Input */}
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                        pl: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#6B7280',
                          fontWeight: 500,
                        }}
                      >
                        Mot de passe
                      </Typography>
                      <Typography
                        component="a"
                        href="#"
                        sx={{
                          fontSize: '0.625rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#bd0f3b',
                          fontWeight: 700,
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Oublié?
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(189, 15, 59, 0.05)',
                          borderColor: 'rgba(189, 15, 59, 0.2)',
                          borderRadius: 2,
                          color: '#F5F5F5',
                          '&:hover fieldset': {
                            borderColor: 'rgba(189, 15, 59, 0.3)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#bd0f3b',
                          },
                        },
                        '& .MuiInputBase-input': {
                          py: 2,
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: '#9CA3AF' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  {/* Submit Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleLogin}
                    disabled={loading}
                    sx={{
                      backgroundColor: '#bd0f3b',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      py: 2,
                      borderRadius: 2,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontSize: '0.875rem',
                      boxShadow: '0 4px 6px rgba(189, 15, 59, 0.2)',
                      '&:hover': {
                        backgroundColor: '#9a0c2f',
                      },
                      '&:disabled': {
                        backgroundColor: '#4B5563',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
                    ) : (
                      'Access Portal'
                    )}
                  </Button>

                  {/* Register Link */}
                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        color: '#6B7280',
                      }}
                    >
                      Pas encore membre?{' '}
                      <Typography
                        component="span"
                        onClick={() => setTab(1)}
                        sx={{
                          color: '#bd0f3b',
                          fontWeight: 600,
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Demander une invitation
                      </Typography>
                    </Typography>
                  </Box>
                </motion.div>
              )}

              {tab === 1 && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Name Input */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#bd0f3b',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Nom complet
                    </Typography>
                    <TextField
                      fullWidth
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Entrez votre nom complet"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(29, 14, 17, 1)',
                          borderColor: 'rgba(61, 31, 37, 1)',
                          borderRadius: 2,
                          color: '#F5F5F5',
                          height: 56,
                          '&:hover fieldset': {
                            borderColor: 'rgba(189, 15, 59, 0.3)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#bd0f3b',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Phone Input */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#bd0f3b',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Numéro de téléphone
                    </Typography>
                    <TextField
                      fullWidth
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0612345678"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(29, 14, 17, 1)',
                          borderColor: 'rgba(61, 31, 37, 1)',
                          borderRadius: 2,
                          color: '#F5F5F5',
                          height: 56,
                          '&:hover fieldset': {
                            borderColor: 'rgba(189, 15, 59, 0.3)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#bd0f3b',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Password Input */}
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#bd0f3b',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Mot de passe
                    </Typography>
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(29, 14, 17, 1)',
                          borderColor: 'rgba(61, 31, 37, 1)',
                          borderRadius: 2,
                          color: '#F5F5F5',
                          height: 56,
                          '&:hover fieldset': {
                            borderColor: 'rgba(189, 15, 59, 0.3)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#bd0f3b',
                          },
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: '#9CA3AF' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  {/* Confirm Password */}
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmer le mot de passe"
                      disabled={loading}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(29, 14, 17, 1)',
                          borderColor: 'rgba(61, 31, 37, 1)',
                          borderRadius: 2,
                          color: '#F5F5F5',
                          height: 56,
                          '&:hover fieldset': {
                            borderColor: 'rgba(189, 15, 59, 0.3)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#bd0f3b',
                          },
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              sx={{ color: '#9CA3AF' }}
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  {/* Submit Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSignUp}
                    disabled={loading}
                    sx={{
                      backgroundColor: '#bd0f3b',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      py: 2,
                      borderRadius: 2,
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      fontSize: '0.875rem',
                      boxShadow: '0 4px 6px rgba(189, 15, 59, 0.2)',
                      '&:hover': {
                        backgroundColor: '#9a0c2f',
                      },
                      '&:disabled': {
                        backgroundColor: '#4B5563',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
                    ) : (
                      'Join the Club'
                    )}
                  </Button>

                  {/* Login Link */}
                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        color: '#6B7280',
                        fontWeight: 300,
                      }}
                    >
                      Déjà un compte?{' '}
                      <Typography
                        component="span"
                        onClick={() => setTab(0)}
                        sx={{
                          color: '#bd0f3b',
                          fontWeight: 700,
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Se connecter
                      </Typography>
                    </Typography>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default LoginScreen;
