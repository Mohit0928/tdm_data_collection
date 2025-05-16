# TDM Data Collection

A lightweight, front-end-only web application for collecting form data and storing it in Google Sheets. Built with React, TypeScript, and Material UI.

## Features

- Dynamic form generation with various field types:
  - Text fields
  - Number fields
  - Date fields
  - Boolean fields (Yes/No)
  - Coded values (multiple choice)
  - Select dropdowns
- Form configuration saved in local storage
- Patient/user ID management with history tracking
- Google Sheets integration as a backend database
- Cross-origin compatible with multiple fallback mechanisms
- Works entirely client-side (can be hosted on GitHub Pages)
- Responsive design for all device types

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/mohit0928/tdm_data_collection.git
   cd tdm_data_collection
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure Google Sheets integration:
   - Create a new Google Sheet at https://sheets.google.com
   - Go to Extensions > Apps Script
   - Replace the default code with the content of `google_apps_script.js`
   - Save the script (Ctrl+S or Cmd+S)
   - Click Deploy > New Deployment
   - Choose "Web app" as the deployment type
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone" (or "Anyone within [your organization]" if using a Google Workspace account)
   - Click "Deploy"
   - Copy the Web App URL that appears

4. Set up environment variables:
   
   For local development, create a `.env` file in the root directory:
   ```
   REACT_APP_GOOGLE_SCRIPT_URL=your_google_script_url_here
   ```

   For production deployment:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Add a new repository secret:
     - Name: `REACT_APP_GOOGLE_SCRIPT_URL`
     - Value: Your Google Script Web App URL

5. Start the development server:
   ```
   npm start
   ```

6. Build for production:
   ```
   npm run build
   ```

## Environment Variables

The following environment variables are used in the application:

- `REACT_APP_GOOGLE_SCRIPT_URL`: The URL of your deployed Google Apps Script Web App
  - Required for Google Sheets integration
  - If not set, the application will use the mock implementation

## Google Sheet Structure

The Google Sheet should have the following columns:
- `userId`: The patient/user identifier
- `timestamp`: When the data was submitted
- Additional columns for each field in your form configuration

## Form Configuration

Forms are configured using a FormConfig object:

```typescript
{
  fields: [
    {
      id: "firstName",
      type: "text",
      label: "First Name",
      required: true,
      group: "Basic Information"
    },
    {
      id: "patientStatus",
      type: "codedValue",
      label: "Patient Status",
      group: "Clinical Information",
      codedOptions: [
        { code: 0, label: "New Patient" },
        { code: 1, label: "Follow-up" },
        { code: 2, label: "Emergency" }
      ]
    }
    // More fields...
  ],
  groups: ["Basic Information", "Clinical Information"],
  title: "Patient Intake Form"
}
```

## Development Notes

- Boolean and coded values are stored as numbers (0, 1, 2) for easier analysis
- The application handles CORS issues with Google Sheets using multiple fallback approaches
- A mock database implementation is available for development without requiring Google Sheets connection
- Environment variables are loaded at build time for security
- GitHub Secrets are used for production deployment

## Troubleshooting

- If you encounter CORS issues, ensure the Google Apps Script has proper CORS headers
- Make sure the `REACT_APP_GOOGLE_SCRIPT_URL` environment variable is set correctly
- Check browser console for any error messages
- If using GitHub Pages, verify that the GitHub Secret is properly set

## License

MIT 