import React from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const NetworkIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();

  return (
    <>
      {/* Indicateur hors ligne */}
      <Snackbar
        open={!isOnline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' }}
      >
        <Alert
          severity="error"
          sx={{
            backgroundColor: '#DC143C',
            color: '#FFFFFF',
            fontWeight: 600,
            '& .MuiAlert-icon': {
              color: '#FFFFFF',
            },
          }}
        >
          Pas de connexion Internet
        </Alert>
      </Snackbar>

      {/* Indicateur reconnexion */}
      <Snackbar
        open={isOnline && wasOffline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' }}
        autoHideDuration={3000}
      >
        <Alert
          severity="success"
          sx={{
            backgroundColor: '#2E7D32',
            color: '#FFFFFF',
            fontWeight: 600,
            '& .MuiAlert-icon': {
              color: '#FFFFFF',
            },
          }}
        >
          Connexion rétablie
        </Alert>
      </Snackbar>
    </>
  );
};

export default NetworkIndicator;
