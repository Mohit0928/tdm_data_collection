import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, Alert, Switch, FormControlLabel, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import FormField from './FormField';
import { FormConfig, FormData } from '../types';
import { saveToGoogleSheets, fetchUserData } from '../services/googleSheets';

interface DynamicFormProps {
  config: FormConfig;
  userId: string;
}

export default function DynamicForm({ config, userId }: DynamicFormProps) {
  const { register, handleSubmit, setValue, reset } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userDataFound, setUserDataFound] = useState(false);
  const [loadExistingRecord, setLoadExistingRecord] = useState(true);
  const [patientId, setPatientId] = useState(userId);
  
  // Remove automatic loading of user data when userId changes
  // Instead we'll load it manually when the user clicks the load button
  
  const loadUserData = async (userIdToLoad: string) => {
    if (!userIdToLoad) return;
    
    setLoading(true);
    setError(null);
    setUserDataFound(false);
    
    try {
      console.log('Loading data for user:', userIdToLoad);
      const userData = await fetchUserData(userIdToLoad);
      
      if (userData) {
        console.log('User data found:', userData);
        setUserDataFound(true);
        
        // Reset form first to clear any previous values
        reset();
        
        // Pre-fill the form with user data
        config.fields.forEach(field => {
          if (userData[field.id] !== undefined) {
            // Handle different field types
            if (field.type === 'boolean' || field.type === 'codedValue') {
              // Convert numeric values to strings for radio buttons
              setValue(field.id, String(userData[field.id]));
            } else if (field.type === 'date' && userData[field.id]) {
              // Format date values properly
              const dateVal = userData[field.id];
              if (typeof dateVal === 'string') {
                // For ISO dates, extract just the YYYY-MM-DD part
                const datePart = dateVal.split('T')[0];
                setValue(field.id, datePart);
              } else {
                setValue(field.id, dateVal);
              }
            } else {
              // For other field types, just set the value
              setValue(field.id, userData[field.id]);
            }
          }
        });
      } else {
        console.log('No user data found for ID:', userIdToLoad);
        reset(); // Clear form if no data found
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error loading user data');
    } finally {
      setLoading(false);
    }
  };
  
  // Load initial data when component mounts if loadExistingRecord is true
  useEffect(() => {
    if (loadExistingRecord && userId) {
      setPatientId(userId);
      loadUserData(userId);
    }
  }, []);
  
  const onSubmit = async (data: FormData) => {
    setSaveLoading(true);
    setError(null);
    
    try {
      const processedData = { ...data };
      
      config.fields.forEach(field => {
        if (field.type === 'date' && processedData[field.id]) {
          const dateValue = processedData[field.id];
          if (typeof dateValue === 'string' && !dateValue.includes('T')) {
            processedData[field.id] = dateValue;
          }
        } else if ((field.type === 'boolean' || field.type === 'codedValue') && processedData[field.id] !== undefined) {
          processedData[field.id] = Number(processedData[field.id]);
        }
      });
      
      const formData = {
        ...processedData,
        userId: patientId,
        timestamp: new Date().toISOString(),
      };
      
      console.log('Submitting form data:', formData);
      const result = await saveToGoogleSheets(formData);
      console.log('Save result:', result);
      
      if (result.success) {
        alert('Data saved successfully to Google Sheets!');
      } else {
        throw new Error(result.error || 'Unknown error saving data');
      }
    } catch (err) {
      console.error('Error saving data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error saving data');
    } finally {
      setSaveLoading(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {config.title || 'Data Collection Form'}
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Switch
              checked={loadExistingRecord}
              onChange={(e) => setLoadExistingRecord(e.target.checked)}
              color="primary"
            />
          }
          label="Load existing record"
        />
        
        <TextField 
          label="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          size="small"
          sx={{ ml: 2, flexGrow: 1 }}
        />
        
        <Button
          variant="outlined"
          onClick={() => loadUserData(patientId)}
          disabled={loading || !loadExistingRecord}
          sx={{ ml: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Load Records'}
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {userDataFound && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Previous data loaded for user ID: {patientId}. You can make changes and submit to create a new entry.
            </Alert>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            {config.groups.map((group) => {
              const groupFields = config.fields.filter((field) => field.group === group);
              
              if (groupFields.length === 0) {
                return null;
              }
              
              return (
                <Box key={group} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {group}
                  </Typography>
                  
                  {groupFields.map((field) => (
                    <FormField key={field.id} field={field} register={register} />
                  ))}
                </Box>
              );
            })}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={saveLoading}
              >
                {saveLoading ? <CircularProgress size={24} /> : 'Save Data'}
              </Button>
            </Box>
          </form>
        </>
      )}
    </Paper>
  );
} 