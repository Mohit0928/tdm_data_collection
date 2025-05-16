import { useState, useEffect } from 'react'
import { 
  Box, 
  Container, 
  TextField, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  Switch, 
  FormControlLabel, 
  Divider 
} from '@mui/material'
import DynamicForm from './components/DynamicForm'
import FormEditor from './components/FormEditor'
import { defaultFormConfig } from './config/formConfig'
import { FormConfig } from './types'
import './App.css'

// Storage key for the form configuration
const FORM_CONFIG_STORAGE_KEY = 'tdm_form_configuration';
const RECENT_USER_IDS_KEY = 'tdm_recent_user_ids';
const MAX_RECENT_IDS = 10;

function App() {
  const [userId, setUserId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [formConfig, setFormConfig] = useState<FormConfig>(defaultFormConfig)
  const [isNewRecord, setIsNewRecord] = useState(true)
  const [recentUserIds, setRecentUserIds] = useState<string[]>([])
  
  // Load the saved configuration when the component mounts
  useEffect(() => {
    const savedConfig = localStorage.getItem(FORM_CONFIG_STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setFormConfig(parsedConfig);
        console.log('Form configuration loaded from local storage');
      } catch (error) {
        console.error('Error loading form configuration from local storage:', error);
      }
    }

    // Load recent user IDs
    const savedUserIds = localStorage.getItem(RECENT_USER_IDS_KEY);
    if (savedUserIds) {
      try {
        const parsedUserIds = JSON.parse(savedUserIds);
        setRecentUserIds(parsedUserIds);
      } catch (error) {
        console.error('Error loading recent user IDs:', error);
      }
    }
  }, []);

  // Save configuration to local storage whenever it changes
  const handleConfigChange = (newConfig: FormConfig) => {
    setFormConfig(newConfig);
    try {
      localStorage.setItem(FORM_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      console.log('Form configuration saved to local storage');
    } catch (error) {
      console.error('Error saving form configuration to local storage:', error);
    }
  };
  
  // Function to generate a random ID
  const generateRandomId = () => {
    const timestamp = new Date().getTime().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomStr}`;
  };

  const handleUserIdSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isNewRecord && !userId.trim()) {
      // Generate a new ID if the user is creating a new record and didn't enter an ID
      const newId = generateRandomId();
      setUserId(newId);
      saveUserIdToRecent(newId);
      setShowForm(true);
    } else if (userId.trim()) {
      // Use the provided ID if it's not empty
      saveUserIdToRecent(userId);
      setShowForm(true);
    }
  }
  
  const handleGenerateId = () => {
    setUserId(generateRandomId());
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const saveUserIdToRecent = (id: string) => {
    // Avoid duplicate entries
    if (!recentUserIds.includes(id)) {
      // Add the new ID to the beginning and limit the list size
      const updatedIds = [id, ...recentUserIds].slice(0, MAX_RECENT_IDS);
      setRecentUserIds(updatedIds);
      localStorage.setItem(RECENT_USER_IDS_KEY, JSON.stringify(updatedIds));
    }
  };

  const handleSelectRecentId = (id: string) => {
    setUserId(id);
    setIsNewRecord(false); // Switch to loading existing record mode
  };

  // Add this function to reset the form configuration
  const handleResetConfig = () => {
    if (window.confirm('Are you sure you want to reset the form configuration to defaults? This cannot be undone.')) {
      setFormConfig(defaultFormConfig);
      localStorage.setItem(FORM_CONFIG_STORAGE_KEY, JSON.stringify(defaultFormConfig));
      console.log('Form configuration reset to defaults');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          TDM Data Collection
        </Typography>
        
        {!showForm ? (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Patient Identification
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={isNewRecord}
                  onChange={(e) => setIsNewRecord(e.target.checked)}
                  color="primary"
                />
              }
              label={isNewRecord ? "Creating new record" : "Loading existing record"}
            />
            
            <form onSubmit={handleUserIdSubmit}>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label={isNewRecord ? "Patient ID (optional)" : "Patient ID"}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  margin="normal"
                  required={!isNewRecord}
                  helperText={isNewRecord ? "Leave blank to auto-generate ID, or enter a custom ID" : "Enter the existing patient ID to load their data"}
                />
              </Box>
              
              {isNewRecord && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleGenerateId}
                  >
                    Generate ID
                  </Button>
                </Box>
              )}
              
              {!isNewRecord && recentUserIds.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent Patient IDs:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {recentUserIds.map((id) => (
                      <Button
                        key={id}
                        size="small"
                        variant="outlined"
                        onClick={() => handleSelectRecentId(id)}
                      >
                        {id}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                >
                  {isNewRecord ? "Create New Record" : "Load Record"}
                </Button>
              </Box>
            </form>
          </Paper>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Patient ID: {userId}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => setShowForm(false)}
              >
                Back to ID Selection
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="Form tabs">
                  <Tab label="Form" />
                  <Tab label="Configure" />
                </Tabs>
              </Box>
              {activeTab === 1 && (
                <Button 
                  variant="outlined" 
                  color="error"
                  size="small"
                  onClick={handleResetConfig}
                  sx={{ ml: 2 }}
                >
                  Reset Config
                </Button>
              )}
            </Box>
            {activeTab === 0 ? (
              <DynamicForm config={formConfig} userId={userId} />
            ) : (
              <FormEditor config={formConfig} onChange={handleConfigChange} />
            )}
          </>
        )}
      </Box>
    </Container>
  )
}

export default App 