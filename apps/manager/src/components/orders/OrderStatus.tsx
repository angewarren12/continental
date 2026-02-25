import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  LocalDining as PreparingIcon,
  Restaurant as ReadyIcon,
  DoneAll as CompletedIcon,
  Cancel as CancelledIcon,
  AccessTime as TimeIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '@shared/types/order';
import { User } from '@shared/types/user';
import { staggerContainer, staggerItem } from '../../constants/animations';

interface OrderStatusProps {
  order: Order;
  onStatusChange?: (orderId: number, newStatus: string, reason?: string) => void;
  readOnly?: boolean;
  showTimeline?: boolean;
  compact?: boolean;
}

interface StatusStep {
  status: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  completed?: boolean;
  timestamp?: Date;
}

const OrderStatus: React.FC<OrderStatusProps> = ({
  order,
  onStatusChange,
  readOnly = false,
  showTimeline = true,
  compact = false,
}) => {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Design tokens temporaires
  const designTokens = {
    colors: {
      text: {
        primary: '#000000',
        secondary: '#666666',
      },
      primary: {
        main: '#DC143C',
        dark: '#8B0000',
      },
      success: {
        main: '#4CAF50',
      },
      error: {
        main: '#F44336',
      },
      warning: {
        main: '#FF9800',
      },
      info: {
        main: '#2196F3',
      },
    },
    transitions: {
      normal: 'all 0.2s ease-in-out',
    },
  };

  const statusSteps: StatusStep[] = [
    {
      status: 'pending',
      label: 'En attente',
      description: 'Commande reçue et en attente de traitement',
      icon: <PendingIcon />,
      color: designTokens.colors.warning.main,
      completed: order.status === 'pending' || ['preparing', 'ready', 'completed'].includes(order.status),
      timestamp: new Date(order.createdAt),
    },
    {
      status: 'preparing',
      label: 'En préparation',
      description: 'La commande est en cours de préparation en cuisine',
      icon: <PreparingIcon />,
      color: designTokens.colors.info.main,
      completed: ['preparing', 'ready', 'completed'].includes(order.status),
    },
    {
      status: 'ready',
      label: 'Prête',
      description: 'La commande est prête et attend d\'être servie',
      icon: <ReadyIcon />,
      color: designTokens.colors.success.main,
      completed: ['ready', 'completed'].includes(order.status),
    },
    {
      status: 'completed',
      label: 'Terminée',
      description: 'La commande a été servie et terminée',
      icon: <CompletedIcon />,
      color: designTokens.colors.success.main,
      completed: order.status === 'completed',
      timestamp: order.completedAt ? new Date(order.completedAt) : undefined,
    },
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.status === order.status);
  const isCancelled = order.status === 'cancelled';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return designTokens.colors.warning.main;
      case 'preparing': return designTokens.colors.info.main;
      case 'ready': return designTokens.colors.success.main;
      case 'completed': return designTokens.colors.success.main;
      case 'cancelled': return designTokens.colors.error.main;
      default: return designTokens.colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getAvailableStatuses = () => {
    if (order.status === 'cancelled' || order.status === 'completed') {
      return [];
    }

    const statuses = ['pending', 'preparing', 'ready', 'completed'];
    const currentIndex = statuses.indexOf(order.status);
    
    return statuses.slice(currentIndex + 1);
  };

  const handleStatusChange = () => {
    if (!selectedStatus) {
      setError('Veuillez sélectionner un nouveau statut');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (onStatusChange) {
        onStatusChange(order.id, selectedStatus, statusReason);
        setSuccess(`Statut mis à jour: ${getStatusLabel(selectedStatus)}`);
      }
      
      setStatusDialogOpen(false);
      setSelectedStatus('');
      setStatusReason('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  const openStatusDialog = () => {
    setError(null);
    setStatusDialogOpen(true);
  };

  const renderStatusCard = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: designTokens.colors.text.primary, fontWeight: 600 }}>
            Statut de la commande
          </Typography>
          
          {!readOnly && !isCancelled && getAvailableStatuses().length > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={openStatusDialog}
              sx={{
                borderColor: getStatusColor(order.status),
                color: getStatusColor(order.status),
              }}
            >
              Mettre à jour
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: getStatusColor(order.status) + '20',
              color: getStatusColor(order.status),
            }}
          >
            {order.status === 'cancelled' ? <CancelledIcon /> : statusSteps[currentStepIndex]?.icon}
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: getStatusColor(order.status), fontWeight: 600 }}>
              {getStatusLabel(order.status)}
            </Typography>
            <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
              {isCancelled 
                ? 'Cette commande a été annulée'
                : statusSteps[currentStepIndex]?.description
              }
            </Typography>
          </Box>
          
          <Chip
            label={getStatusLabel(order.status)}
            sx={{
              bgcolor: getStatusColor(order.status),
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Box>

        {/* Payment Status */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E0E0E0' }}>
          <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary, mb: 1 }}>
            Statut de paiement
          </Typography>
          <Chip
            label={order.paymentStatus === 'paid' ? 'Payée' : 'En attente'}
            sx={{
              bgcolor: order.paymentStatus === 'paid' ? designTokens.colors.success.main : designTokens.colors.warning.main,
              color: 'white',
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  const renderTimeline = () => {
    if (!showTimeline || isCancelled) return null;

    return (
      <Card>
        <CardContent sx={{ p: compact ? 2 : 3 }}>
          <Typography variant="h6" sx={{ mb: 3, color: designTokens.colors.text.primary, fontWeight: 600 }}>
            Progression de la commande
          </Typography>
          
          <Stepper activeStep={currentStepIndex} orientation="vertical">
            {statusSteps.map((step, index) => (
              <Step key={step.status}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: step.completed ? step.color + '20' : '#F5F5F5',
                        color: step.completed ? step.color : designTokens.colors.text.secondary,
                        border: step.completed ? `2px solid ${step.color}` : '2px solid #E0E0E0',
                      }}
                    >
                      {step.completed ? (
                        <CheckCircleIcon fontSize="small" />
                      ) : (
                        step.icon
                      )}
                    </Box>
                  )}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {step.label}
                    </Typography>
                    {step.timestamp && (
                      <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                        {step.timestamp.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    )}
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary, mb: 1 }}>
                    {step.description}
                  </Typography>
                  {step.timestamp && (
                    <Typography variant="caption" sx={{ color: designTokens.colors.info.main }}>
                      {step.timestamp.toLocaleString('fr-FR')}
                    </Typography>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
    );
  };

  const renderStatusDialog = () => (
    <Dialog
      open={statusDialogOpen}
      onClose={() => setStatusDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Mettre à jour le statut de la commande #{order.id}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Nouveau statut</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Nouveau statut"
            >
              {getAvailableStatuses().map((status) => (
                <MenuItem key={status} value={status}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: getStatusColor(status) + '20',
                        color: getStatusColor(status),
                      }}
                    >
                      {statusSteps.find(step => step.status === status)?.icon}
                    </Box>
                    {getStatusLabel(status)}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Raison (optionnel)"
            multiline
            rows={3}
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Expliquez pourquoi vous changez le statut..."
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={() => setStatusDialogOpen(false)}
          disabled={loading}
        >
          Annuler
        </Button>
        
        <Button
          variant="contained"
          onClick={handleStatusChange}
          disabled={loading || !selectedStatus}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          sx={{
            bgcolor: designTokens.colors.primary.main,
            '&:hover': { bgcolor: designTokens.colors.primary.dark },
          }}
        >
          {loading ? 'Mise à jour...' : 'Confirmer'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderStatusCard()}
      </motion.div>

      {/* Timeline */}
      {showTimeline && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {renderTimeline()}
        </motion.div>
      )}

      {/* Status Dialog */}
      {renderStatusDialog()}
    </Box>
  );
};

export default OrderStatus;
