import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  History as HistoryIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@shared/types/user';
import { staggerContainer, staggerItem } from '../../constants/animations';

interface OrderHistoryEntry {
  id: number;
  orderId: number;
  action: 'created' | 'updated' | 'status_changed' | 'payment_added' | 'cancelled' | 'completed';
  oldValues?: any;
  newValues?: any;
  reason?: string;
  createdBy: number;
  createdAt: Date;
  creator?: User;
}

interface OrderHistoryProps {
  orderId: number;
  entries?: OrderHistoryEntry[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  showPagination?: boolean;
  maxEntries?: number;
  compact?: boolean;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({
  orderId,
  entries = [],
  loading = false,
  error,
  onRefresh,
  showPagination = true,
  maxEntries = 50,
  compact = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<OrderHistoryEntry | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(error || null);

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
    shadows: {
      hover: '0 4px 12px rgba(0,0,0,0.15)',
    },
  };

  useEffect(() => {
    setLocalError(error || null);
  }, [error]);

  const entriesPerPage = 10;
  const totalPages = Math.ceil(entries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = entries.slice(startIndex, endIndex);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <AddIcon />;
      case 'updated':
        return <EditIcon />;
      case 'status_changed':
        return <HistoryIcon />;
      case 'payment_added':
        return <PaymentIcon />;
      case 'cancelled':
        return <CancelIcon />;
      case 'completed':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return designTokens.colors.success.main;
      case 'updated':
        return designTokens.colors.info.main;
      case 'status_changed':
        return designTokens.colors.warning.main;
      case 'payment_added':
        return designTokens.colors.success.main;
      case 'cancelled':
        return designTokens.colors.error.main;
      case 'completed':
        return designTokens.colors.success.main;
      default:
        return designTokens.colors.text.secondary;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Commande créée';
      case 'updated':
        return 'Commande mise à jour';
      case 'status_changed':
        return 'Statut modifié';
      case 'payment_added':
        return 'Paiement ajouté';
      case 'cancelled':
        return 'Commande annulée';
      case 'completed':
        return 'Commande terminée';
      default:
        return action;
    }
  };

  const formatChanges = (oldValues?: any, newValues?: any): string[] => {
    if (!oldValues || !newValues) return [];

    const changes: string[] = [];
    
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        const oldValue = oldValues[key];
        const newValue = newValues[key];
        
        switch (key) {
          case 'status':
            changes.push(`Statut: ${oldValue} → ${newValue}`);
            break;
          case 'paymentStatus':
            changes.push(`Paiement: ${oldValue} → ${newValue}`);
            break;
          case 'totalAmount':
            changes.push(`Total: ${oldValue} FCFA → ${newValue} FCFA`);
            break;
          case 'tableNumber':
            changes.push(`Table: ${oldValue || 'Non spécifiée'} → ${newValue || 'Non spécifiée'}`);
            break;
          case 'amount':
            changes.push(`Paiement: ${newValue} FCFA`);
            break;
          case 'method':
            changes.push(`Méthode: ${newValue}`);
            break;
          default:
            changes.push(`${key}: ${oldValue} → ${newValue}`);
        }
      }
    }
    
    return changes;
  };

  const handleEntryClick = (entry: OrderHistoryEntry) => {
    setSelectedEntry(entry);
    setDetailsDialogOpen(true);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const renderHistoryEntry = (entry: OrderHistoryEntry, index: number) => {
    const changes = formatChanges(entry.oldValues, entry.newValues);
    const hasChanges = changes.length > 0;

    return (
      <motion.div variants={staggerItem} custom={index} key={entry.id}>
        <ListItem
          sx={{
            px: 0,
            py: compact ? 1 : 2,
            cursor: 'pointer',
            transition: designTokens.transitions.normal,
            '&:hover': {
              bgcolor: '#F5F5F5',
            },
          }}
          onClick={() => handleEntryClick(entry)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: getActionColor(entry.action) + '20',
                color: getActionColor(entry.action),
              }}
            >
              {getActionIcon(entry.action)}
            </Box>
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {getActionLabel(entry.action)}
                </Typography>
                <Chip
                  label={new Date(entry.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.6rem' }}
                />
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary, mb: 1 }}>
                  {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
                  {entry.creator && ` • ${entry.creator.name}`}
                </Typography>
                
                {entry.reason && (
                  <Typography variant="caption" sx={{ color: designTokens.colors.info.main, fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                    "{entry.reason}"
                  </Typography>
                )}
                
                {hasChanges && (
                  <Box sx={{ mt: 1 }}>
                    {changes.slice(0, 2).map((change, changeIndex) => (
                      <Typography key={changeIndex} variant="caption" sx={{ color: designTokens.colors.text.secondary, display: 'block' }}>
                        • {change}
                      </Typography>
                    ))}
                    {changes.length > 2 && (
                      <Typography variant="caption" sx={{ color: designTokens.colors.info.main }}>
                        +{changes.length - 2} autre(s) modification(s)
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            }
          />
          
          <IconButton size="small" sx={{ color: designTokens.colors.info.main }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </ListItem>
        
        {index < currentEntries.length - 1 && <Divider />}
      </motion.div>
    );
  };

  const renderDetailsDialog = () => {
    if (!selectedEntry) return null;

    const changes = formatChanges(selectedEntry.oldValues, selectedEntry.newValues);

    return (
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: getActionColor(selectedEntry.action) + '20',
                color: getActionColor(selectedEntry.action),
              }}
            >
              {getActionIcon(selectedEntry.action)}
            </Box>
            <Box>
              <Typography variant="h6">
                {getActionLabel(selectedEntry.action)}
              </Typography>
              <Typography variant="caption" sx={{ color: designTokens.colors.text.secondary }}>
                {new Date(selectedEntry.createdAt).toLocaleString('fr-FR')}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: designTokens.colors.text.primary }}>
              Informations générales
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <HistoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="ID de l'entrée"
                  secondary={selectedEntry.id}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Effectué par"
                  secondary={selectedEntry.creator?.name || `Utilisateur #${selectedEntry.createdBy}`}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <AccessTimeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Date et heure"
                  secondary={new Date(selectedEntry.createdAt).toLocaleString('fr-FR')}
                />
              </ListItem>
              
              {selectedEntry.reason && (
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Raison"
                    secondary={selectedEntry.reason}
                  />
                </ListItem>
              )}
            </List>
          </Box>

          {changes.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: designTokens.colors.text.primary }}>
                Modifications apportées
              </Typography>
              
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  {changes.map((change, index) => (
                    <Box key={index} sx={{ mb: 1, pb: 1, borderBottom: index < changes.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                      <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
                        {change}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>
          )}

          {selectedEntry.oldValues && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: designTokens.colors.text.primary }}>
                Données techniques
              </Typography>
              
              <Card variant="outlined">
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary, mb: 2 }}>
                    Anciennes valeurs:
                  </Typography>
                  <pre style={{ fontSize: '0.8rem', color: '#666', background: '#F9F9F9', padding: '8px', borderRadius: '4px' }}>
                    {JSON.stringify(selectedEntry.oldValues, null, 2)}
                  </pre>
                  
                  <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary, mb: 2, mt: 2 }}>
                    Nouvelles valeurs:
                  </Typography>
                  <pre style={{ fontSize: '0.8rem', color: '#666', background: '#F9F9F9', padding: '8px', borderRadius: '4px' }}>
                    {JSON.stringify(selectedEntry.newValues, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={40} sx={{ color: designTokens.colors.primary.main }} />
      </Box>
    );
  }

  if (localError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {localError}
      </Alert>
    );
  }

  if (entries.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <HistoryIcon sx={{ fontSize: 48, color: designTokens.colors.text.secondary, mb: 2 }} />
        <Typography variant="h6" sx={{ color: designTokens.colors.text.secondary, mb: 1 }}>
          Aucun historique disponible
        </Typography>
        <Typography variant="body2" sx={{ color: designTokens.colors.text.secondary }}>
          Cette commande n'a pas encore d'historique de modifications
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: designTokens.colors.text.primary, fontWeight: 600 }}>
          Historique de la commande #{orderId}
        </Typography>
        
        {onRefresh && (
          <Tooltip title="Rafraîchir l'historique">
            <IconButton onClick={onRefresh} disabled={loading}>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* History List */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        <List sx={{ p: 0 }}>
          {currentEntries.map((entry, index) => renderHistoryEntry(entry, index))}
        </List>
      </motion.div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size={compact ? 'small' : 'medium'}
          />
        </Box>
      )}

      {/* Details Dialog */}
      {renderDetailsDialog()}
    </Box>
  );
};

export default OrderHistory;
