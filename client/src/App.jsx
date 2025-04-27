import React, { useState } from 'react';
import PromptForm from './components/PromptForm';
import ScenePreview from './components/ScenePreview';
import styles from './App.module.css';

export default function App() {
  const [generationResult, setGenerationResult] = useState(null);
  const [latestError, setLatestError] = useState(null);
  
  const handleGenerationResult = (result) => {
    setGenerationResult(result);
    setLatestError(null);
  };
  
  const handleGenerationError = (error) => {
    setLatestError(error);
  };
  
  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI Scene Generator</h1>
        <p className={styles.subtitle}>
          Create stunning AI-generated imagery using advanced prompt engineering and image generation
        </p>
      </header>
      
      <div className={styles.mainContent}>
        <PromptForm 
          onResult={handleGenerationResult} 
          onError={handleGenerationError}
        />
        
        {latestError && (
          <div className={styles.globalError}>
            <div className={styles.errorIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.errorContent}>
              <h3 className={styles.errorTitle}>{latestError.error}</h3>
              <p className={styles.errorMessage}>{latestError.message}</p>
              {latestError.reason && (
                <p className={styles.errorReason}>{latestError.reason}</p>
              )}
            </div>
          </div>
        )}
        
        <ScenePreview data={generationResult} />
      </div>
      
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>
            Powered by advanced AI technologies from Stability AI and Google AI.
          </p>
          <div className={styles.footerLinks}>
            <a 
              href="https://stability.ai/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Terms
            </a>
            <span className={styles.footerDivider}>•</span>
            <a 
              href="https://stability.ai/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}