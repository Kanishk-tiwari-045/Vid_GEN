import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/ScenePreview.module.css';

export default function ScenePreview({ data }) {
  const [activeTab, setActiveTab] = useState('image');
  const [expandedSection, setExpandedSection] = useState(null);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
const [isLoadingAudio, setIsLoadingAudio] = useState(false);
const [audioError, setAudioError] = useState(null);
const videoRef = useRef(null);
const audioRef = useRef(null);
// Add this state variable to your existing state in ScenePreview.jsx
const [audioMuted, setAudioMuted] = useState(true);

// Update the handleVideoPlayPause function to unmute audio on first play
const handleVideoPlayPause = (event) => {
  if (videoRef.current && audioRef.current) {
    if (videoRef.current.paused) {
      // Play both video and audio
      videoRef.current.play().catch(e => console.error("Video play error:", e));
      audioRef.current.play().catch(e => console.error("Audio play error:", e));
      
      // Unmute audio on first play if it's currently muted
      if (audioMuted) {
        audioRef.current.muted = false;
        setAudioMuted(false);
      }
    } else {
      // Pause both video and audio
      videoRef.current.pause();
      audioRef.current.pause();
    }
  }
};

// Add a new function to toggle audio mute state
const toggleAudio = () => {
  if (audioRef.current) {
    audioRef.current.muted = !audioRef.current.muted;
    setAudioMuted(!audioMuted);
  }
};

useEffect(() => {
  if (data && parsed && parsed.features && parsed.features.background_audio_suggestion) {
    fetchAudio(parsed.features.background_audio_suggestion);
  }
}, [data]);

// Add this function to fetch audio
const fetchAudio = async (audioPrompt) => {
  try {
    setIsLoadingAudio(true);
    setAudioError(null);
    
    const response = await fetch('/api/audio/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        prompt: audioPrompt
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate audio');
    }
    
    const audioBlob = await response.blob();
    const audioObjectUrl = URL.createObjectURL(audioBlob);
    setAudioUrl(audioObjectUrl);
  } catch (error) {
    console.error('Audio generation error:', error);
    setAudioError(error.message);
  } finally {
    setIsLoadingAudio(false);
  }
};
  
  // If no data is provided yet, show a placeholder
  if (!data) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className={styles.placeholderTitle}>Ready to Create</p>
          <p className={styles.placeholderText}>
            Enter a descriptive scenario and click Generate to create an AI-generated image
          </p>
        </div>
      </div>
    );
  }
  const formatFeatureKey = (key) => {
    // Convert camelCase or snake_case to Title Case with spaces
    return key
      .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/^\w/, c => c.toUpperCase()) // Capitalize first letter
      .trim();
  };
  
  const { parsed, imageUrl, videoUrl } = data;
  
  // Render a JSON field with proper formatting based on type
  const renderJsonField = (key, value) => {
    // Skip certain fields or handle them specially
    if (key === 'rawResponse' && typeof value === 'string' && value.length > 200) {
      return (
        <div key={key} className={styles.jsonField}>
          <span className={styles.jsonKey}>{key}:</span>
          <button 
            className={styles.toggleButton}
            onClick={() => setShowRawResponse(!showRawResponse)}
          >
            {showRawResponse ? 'Hide' : 'Show'} raw response ({value.length} characters)
          </button>
          {showRawResponse && (
            <pre className={styles.rawResponse}>{value}</pre>
          )}
        </div>
      );
    }

    const getFeatureIcon = (featureKey) => {
      const iconMap = {
        // Map feature keys to SVG icons
        style: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 14C9.10457 14 10 13.1046 10 12C10 10.8954 9.10457 10 8 10C6.89543 10 6 10.8954 6 12C6 13.1046 6.89543 14 8 14Z" fill="currentColor"/>
            <path d="M16 14C17.1046 14 18 13.1046 18 12C18 10.8954 17.1046 10 16 10C14.8954 10 14 10.8954 14 12C14 13.1046 14.8954 14 16 14Z" fill="currentColor"/>
          </svg>
        ),
        mood: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 9H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        setting: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 5L21 9L12 13L3 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 9V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 10.5V16.5L12 19L17 16.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        time: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        lighting: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 18V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 21H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 14H15L16 3.5L12 2L8 3.5L9 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        colors: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"/>
          </svg>
        ),
        subject: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 21C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" fill="currentColor"/>
            <path d="M21 15L16 10L5 21H21V15Z" fill="currentColor" fillOpacity="0.2"/>
          </svg>
        ),
        main: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 21C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" fill="currentColor"/>
            <path d="M21 15L16 10L5 21H21V15Z" fill="currentColor" fillOpacity="0.2"/>
          </svg>
        ),
        emotion: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 9H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        camera: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 9.5V16C22 17.1046 21.1046 18 20 18H4C2.89543 18 2 17.1046 2 16V9.5M22 9.5V8C22 6.89543 21.1046 6 20 6H16L14 4H10L8 6H4C2.89543 6 2 6.89543 2 8V9.5M22 9.5H2M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        action: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        audio: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 8C15.5 8 17 9.5 17 12C17 14.5 15.5 16 15.5 16M18.5 5C18.5 5 21 7.5 21 12C21 16.5 18.5 19 18.5 19M8 8H3C2.44772 8 2 8.44772 2 9V15C2 15.5523 2.44772 16 3 16H8L14 21V3L8 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        atmosphere: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9C3 7.89543 3.89543 7 5 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 14C10.5 13.1716 11.1716 12.5 12 12.5V12.5C12.8284 12.5 13.5 13.1716 13.5 14V14C13.5 14.8284 12.8284 15.5 12 15.5V15.5C11.1716 15.5 10.5 14.8284 10.5 14V14Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13.5 14H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.5 14L7 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        visual: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        art: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12.5C2 12.5 5.5 19 12 19C18.5 19 22 12.5 22 12.5M22 12.5C22 12.5 18.5 6 12 6C5.5 6 2 12.5 2 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        perspective: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8L12 4L20 8L12 12L4 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16L12 12M12 12L20 16M12 12V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        // Add more icons for other feature types
        // Default icon for any feature type not specifically mapped
        default: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      };
    
      // Special handling for compound keys
      if (featureKey.includes('subject')) return iconMap.subject;
      if (featureKey.includes('emotion')) return iconMap.emotion;
      if (featureKey.includes('action') || featureKey.includes('movement')) return iconMap.action;
      if (featureKey.includes('environment') || featureKey.includes('setting')) return iconMap.setting;
      if (featureKey.includes('lighting')) return iconMap.lighting;
      if (featureKey.includes('audio')) return iconMap.audio;
      if (featureKey.includes('camera')) return iconMap.camera;
      if (featureKey.includes('atmosphere')) return iconMap.atmosphere;
      if (featureKey.includes('visual') || featureKey.includes('pacing')) return iconMap.visual;
      if (featureKey.includes('art') || featureKey.includes('style')) return iconMap.art;
      if (featureKey.includes('perspective')) return iconMap.perspective;
    
      // Look for exact match
      const exactMatch = iconMap[featureKey.toLowerCase()];
      if (exactMatch) return exactMatch;
    
      // Return default icon if no match found
      return iconMap.default;
    };
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Special handling for features section
      if (key === 'features') {
        return (
          <div key={key} className={styles.featuresContainer}>
            <h3 className={styles.featuresTitle}>Key Features</h3>
            <div className={styles.featuresGrid}>
              {Object.entries(value).map(([featureKey, featureValue]) => (
                <div key={featureKey} className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    {getFeatureIcon(featureKey)}
                  </div>
                  <div className={styles.featureContent}>
                    <h4 className={styles.featureKey}>{formatFeatureKey(featureKey)}</h4>
                    <p className={styles.featureValue}>
                      {Array.isArray(featureValue) 
                        ? featureValue.join(', ') 
                        : String(featureValue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
    // Handle arrays
    if (Array.isArray(value)) {
      return (
        <div key={key} className={styles.jsonField}>
          <span className={styles.jsonKey}>{key}:</span>
          <span className={styles.jsonValue}>{value.join(', ')}</span>
        </div>
      );
    }
    
    // Handle simple values
    return (
      <div key={key} className={styles.jsonField}>
        <span className={styles.jsonKey}>{key}:</span>
        <span className={styles.jsonValue}>{String(value)}</span>
      </div>
    );
  };
  
  return (
    <div className={`${styles.previewContainer} ${styles.hasData} ${styles.fadeIn}`}>
      <div className={styles.previewTabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'image' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('image')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <path d="M21 15L16 10L5 21H21V15Z" fill="currentColor" fillOpacity="0.2"/>
          </svg>
          Image
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'details' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12L12 12M12 12L3 12M12 12L12 3M12 12L12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Generation Details
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'prompts' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2H16C17.1046 2 18 2.89543 18 4V20C18 21.1046 17.1046 22 16 22H8C6.89543 22 6 21.1046 6 20V4C6 2.89543 6.89543 2 8 2Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 11H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Prompts
        </button>
        {videoUrl && (
  <button 
    className={`${styles.tabButton} ${activeTab === 'video' ? styles.activeTab : ''} ${styles.hasVideo}`}
    onClick={() => setActiveTab('video')}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 9L16 12L10 15V9Z" fill="currentColor"/>
    </svg>
    Video Animation
  </button>
)}
      </div>

      <div className={styles.previewContent}>
        {/* Image Tab */}
        {activeTab === 'image' && imageUrl && (
          <div className={`${styles.sectionContainer} ${styles.imageSection}`}>
            <div className={styles.imageContainer}>
              <img
                src={imageUrl}
                alt="AI generated from prompt"
                className={styles.image}
              />
            </div>
            <div className={styles.downloadContainer}>
              <a
                href={imageUrl}
                download="ai-generated-image.png"
                className={styles.downloadLink}
              >
                Download Image
              </a>
            </div>
          </div>
        )}
        
        {activeTab === 'video' && (videoUrl || data.isRateLimited) && (
  <div className={`${styles.sectionContainer} ${styles.videoSection}`}>
    {videoUrl ? (
      // Show video if available
      <>
<div className={styles.videoContainer}>
  <video 
    ref={videoRef}
    onClick={handleVideoPlayPause}
    controls 
    loop 
    className={styles.video}
  >
    <source src={videoUrl} type="video/mp4" />
    Your browser does not support video playback.
  </video>
  
  {audioUrl && (
    <>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        loop
        muted={audioMuted}
        style={{ display: 'none' }} // Hide the audio element
      />
      <div className={styles.audioControls}>
        <button 
          className={`${styles.audioButton} ${!audioMuted ? styles.audioActive : ''}`} 
          onClick={toggleAudio}
          title={audioMuted ? "Enable Audio" : "Mute Audio"}
        >
          {audioMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.5 8C18.5 8 20 9.5 20 12C20 14.5 18.5 16 18.5 16M15 5C15 5 21 7 21 12C21 17 15 19 15 19M3 16V8C3 8 3 8 3 8C3 7.44772 3.44772 7 4 7H7.5C7.5 7 9 4 10 4C11 4 11 7 11 7V17C11 17 11 20 10 20C9 20 7.5 17 7.5 17H4C3.44772 17 3 16.5523 3 16C3 16 3 16 3 16ZM22 6L2 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.5 8C18.5 8 20 9.5 20 12C20 14.5 18.5 16 18.5 16M15 5C15 5 21 7 21 12C21 17 15 19 15 19M8 12H4M4 12V16C4 16.5523 4.44772 17 5 17H7.5C7.5 17 9 20 10 20C11 20 11 17 11 17V7C11 7 11 4 10 4C9 4 7.5 7 7.5 7H5C4.44772 7 4 7.44772 4 8V12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        {isLoadingAudio ? (
          <span className={styles.audioStatus}>Loading audio...</span>
        ) : (
          <span className={styles.audioStatus}>{audioMuted ? "Audio muted" : "Audio enabled"}</span>
        )}
      </div>
    </>
  )}
  
  {isLoadingAudio && (
    <div className={styles.audioLoadingIndicator}>
      <svg className={styles.spinnerIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" stroke-dasharray="30 50" />
      </svg>
      <p>Loading audio soundtrack...</p>
    </div>
  )}
  
  {audioError && (
    <div className={styles.audioErrorMessage}>
      <p>Audio couldn't be loaded. Video will play without sound.</p>
      <button 
        className={styles.retryButton}
        onClick={() => fetchAudio(parsed.features.background_audio_suggestion)}
      >
        Retry Audio
      </button>
    </div>
  )}
</div>
        <div className={styles.downloadContainer}>
          <a
            href={videoUrl}
            download="ai-generated-video.mp4"
            className={styles.downloadLink}
          >
            Download Video
          </a>
        </div>
      </>
    ) : (
      // Show appropriate message if no video
      <div className={styles.videoPlaceholder}>
        {data.isRateLimited ? (
          <div className={styles.rateLimitMessage}>
            <div className={styles.rateLimitIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Video Generation Rate Limited</h3>
            <p>The Segmind API is currently rate limited. This typically happens when there are too many requests in a short period.</p>
            <div className={styles.retryInfo}>
              <p>Your image has been successfully generated. You can try video generation again later.</p>
              <button 
                className={styles.retryButton}
                onClick={() => {
                  // If you implement a retry function, call it here
                  alert('This would retry video generation. Implement this functionality if needed.');
                }}
              >
                Try Again Later
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.errorMessage}>
            <div className={styles.errorIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 9L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 9L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Video Generation Failed</h3>
            <p>There was an error generating the video from your image.</p>
            <div className={styles.errorDetails}>
              {parsed.videoError && <p className={styles.errorReason}>{parsed.videoError}</p>}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
)}
        {/* Generation Details Tab */}
        {activeTab === 'details' && (
  <div className={`${styles.sectionContainer} ${styles.detailsSection}`}>
    <div className={styles.metadataSection}>
      <h3 className={styles.metadataTitle}>AI Analysis Results</h3>
      
      <div className={styles.jsonDisplay}>
        {/* Explicitly render the features section first if it exists */}
        {parsed.features && renderJsonField('features', parsed.features)}
        
        {/* Then display all other JSON fields from the parsed data */}
        {parsed && Object.entries(parsed)
          .filter(([key]) => 
            key !== 'image_prompt' && 
            key !== 'video_prompt' && 
            key !== 'originalScenario' &&
            key !== 'features') // Skip features as we've already rendered it
          .map(([key, value]) => renderJsonField(key, value))
        }
      </div>

              
              <h3 className={styles.metadataTitle}>Generation Summary</h3>
              <div className={styles.processList}>
                <div className={styles.processStep} style={{"--step-index": 0}}>
                  <div className={styles.processIcon}>1</div>
                  <div className={styles.processContent}>
                    <h4>Scenario Validation</h4>
                    <p>Checked if the scenario can be physically represented</p>
                  </div>
                </div>
                <div className={styles.processStep} style={{"--step-index": 1}}>
                  <div className={styles.processIcon}>2</div>
                  <div className={styles.processContent}>
                    <h4>Feature Extraction</h4>
                    <p>AI analyzed key elements of the scenario</p>
                  </div>
                </div>
                <div className={styles.processStep} style={{"--step-index": 2}}>
                  <div className={styles.processIcon}>3</div>
                  <div className={styles.processContent}>
                    <h4>Prompt Optimization</h4>
                    <p>Generated optimized image and video prompts</p>
                  </div>
                </div>
                <div className={styles.processStep} style={{"--step-index": 3}}>
                  <div className={styles.processIcon}>4</div>
                  <div className={styles.processContent}>
                    <h4>Image Creation</h4>
                    <p>Stability AI generated the final image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <div className={`${styles.sectionContainer} ${styles.promptsSection}`}>
            <div className={styles.promptSection}>
              <h3 className={styles.promptTitle}>Original Scenario</h3>
              <p className={styles.promptText}>{parsed.originalScenario || "No original scenario provided"}</p>
              
              {parsed.image_prompt && (
                <>
                  <h3 className={styles.promptTitle}>Generated Image Prompt</h3>
                  <p className={styles.promptText}>{parsed.image_prompt}</p>
                </>
              )}
              
              {parsed.video_prompt && (
                <>
                  <h3 className={styles.promptTitle}>Generated Video Prompt</h3>
                  <p className={styles.promptText}>{parsed.video_prompt}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}