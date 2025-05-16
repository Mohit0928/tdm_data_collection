/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_GOOGLE_SCRIPT_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_URL: string;
  }
} 