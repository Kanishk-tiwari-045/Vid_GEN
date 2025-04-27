import React, { useState } from 'react';
import styles from '../styles/PromptForm.module.css';

// List of common impossible scenario patterns
const IMPOSSIBLE_PATTERNS = [
  /all (the )?weather(s)? (at (the )?same time|simultaneously)/i,
  /square circle/i,
  /7 dimension/i,
  /color of (silence|nothing)/i,
  /what nothing looks like/i,
  /physically impossible/i,
  /visualize infinity/i,
  /all colors simultaneously/i,
  /the sound of/i,
  /time (stands|standing) still/i,
  /multiple realities/i,
  /paradox/i,
  /contradictory/i
];

export default function PromptForm({ onResult }) {
  const [scenarioText, setScenarioText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState('input'); // input, validating, processing, generating, complete
  const [error, setError] = useState(null);
  
  // Function to check for impossible scenarios using patterns
  const quickPatternValidation = (text) => {
    for (const pattern of IMPOSSIBLE_PATTERNS) {
      if (pattern.test(text)) {
        return {
          isValid: false,
          error: 'Impossible scenario',
          reason: 'The scenario contains elements that cannot be visualized',
          message: 'Please provide a scenario that can be reasonably depicted in an image or video'
        };
      }
    }
    return { isValid: true };
  };

  // Replace the existing validateWithAI function in PromptForm.jsx with this improved version
const validateWithAI = async (text) => {
  try {
    // Stronger validation with specific instructions that explicitly tells Gemini to respond with JSON only
    const validationPrompt = `
INSTRUCTIONS: You are a strict scenario validator that MUST reject any physically impossible scenarios.

Scenario to validate: "${text}"

Your ONLY job is to determine if this scenario is PHYSICALLY POSSIBLE to visualize in a real image or video.

RULES FOR REJECTION (you MUST reject if ANY apply):
1. Multiple contradictory weather conditions in the same location
2. Logical contradictions or paradoxes (e.g., square circles)
3. Abstract concepts that can't be directly visualized (e.g., "the smell of blue")
4. Scenarios requiring more than 3 spatial dimensions
5. Scenarios violating laws of physics that can't be simulated with visual effects
6. Scenarios requiring omnipresent viewpoints (seeing everywhere at once)
7. Multiple contradictory lighting conditions
8. Scenarios requiring visualization of absence or nothingness itself

DO NOT try to reinterpret impossible scenarios into possible ones.
DO NOT be lenient or creative in your interpretation.

IMPORTANT: Your response MUST be a valid JSON object with NO code blocks, NO markdown formatting.
DO NOT wrap the JSON in \`\`\` markers or other formatting.

Respond with ONLY this JSON:
{
  "is_possible": false,
  "rejection_reason": "Specific reason this violates physical reality or can't be visualized"
}

OR

{
  "is_possible": true
}
`;

    // Call the AI validation API with error handling
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: validationPrompt }),
      });

      if (!response.ok) {
        // If we get a server error, log it but proceed cautiously rather than failing
        console.warn(`Validation API request returned status: ${response.status}`);
        return { 
          isValid: true, 
          warning: 'Validation service returned an error, proceeding with caution' 
        };
      }

      const data = await response.json();
      
      // Check if the AI determined it's impossible
      if (data && data.is_possible === false) {
        return {
          isValid: false,
          error: 'Impossible scenario',
          reason: data.rejection_reason || 'The scenario cannot be reasonably visualized',
          message: 'Please provide a scenario that can be physically represented in an image or video'
        };
      }
      
      return { isValid: true };
    } catch (fetchError) {
      console.error('Validation fetch error:', fetchError);
      // If API call fails, proceed with caution rather than blocking the user entirely
      return { 
        isValid: true, 
        warning: 'Validation service unavailable, proceeding with caution' 
      };
    }
  } catch (error) {
    console.error('Validation error:', error);
    // If overall validation process fails, we'll proceed with caution
    return { 
      isValid: true, 
      warning: 'Validation process error, proceeding with caution' 
    };
  }
};

  // Function to analyze scenario and generate prompts
  const generatePrompts = async (text) => {
    const analysisPrompt = `
You are a creative AI assistant.

Analyze the following scenario carefully: "${text}"

This scenario has been validated as physically possible to visualize.

Extract the following features:
- main_subject
- emotions
- action_or_movement
- environment_and_setting
- lighting_description
- background_audio_suggestion
- camera_movement_suggestion
- atmosphere_description
- visual_pacing
- art_style_suggestion
- perspective
- extra_important_details

After extracting features, create:

1. "image_prompt" - A detailed scene description based on extracted features.
2. "video_prompt" - A detailed animation description based on extracted features.

Respond ONLY in the following pure JSON format:

{
  "features": {
    "main_subject": "",
    "emotions": [],
    "action_or_movement": "",
    "environment_and_setting": "",
    "lighting_description": "",
    "background_audio_suggestion": "",
    "camera_movement_suggestion": "",
    "atmosphere_description": "",
    "visual_pacing": "",
    "art_style_suggestion": "",
    "perspective": "",
    "extra_important_details": ""
  },
  "image_prompt": "",
  "video_prompt": ""
}
`;

    // Call the generation API
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        scenario_text: text,
        analysis_prompt: analysisPrompt 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API request failed with status: ${response.status}`);
    }

    return await response.json();
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  
  // Replace the existing handleSubmit function with this updated version
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!scenarioText.trim()) {
    alert('Please enter a scenario description');
    return;
  }
  
  setLoading(true);
  setError(null);
  setGenerationStep('validating');
  
  try {
    // Step 1: Perform quick pattern validation
    const quickValidation = quickPatternValidation(scenarioText);
    
    if (!quickValidation.isValid) {
      setError(quickValidation);
      setLoading(false);
      setGenerationStep('input');
      return;
    }
    
    // Step 2: Perform AI validation (optional based on API availability)
    const aiValidation = await validateWithAI(scenarioText);
    
    if (!aiValidation.isValid) {
      setError(aiValidation);
      setLoading(false);
      setGenerationStep('input');
      return;
    }
    
    // Step 3: Generate optimized prompts
    setGenerationStep('processing');
    
    // Call our existing API endpoint
    const promptResponse = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scenario_text: scenarioText }),
    });
    
    if (!promptResponse.ok) {
      const errorData = await promptResponse.json();
      
      // Check if this is an impossible scenario error
      if (errorData.error === 'Impossible scenario') {
        setError(errorData);
        setLoading(false);
        setGenerationStep('input');
        return;
      }
      
      throw new Error(errorData.message || `API request failed with status: ${promptResponse.status}`);
    }
    
    const promptData = await promptResponse.json();
    
    // Step 4: Generate image with Stability AI or fallback to a placeholder
    setGenerationStep('generating');

    // Extract the prompts
    const imagePrompt = promptData.image_prompt || 
                 (promptData.features ? `Scene of ${promptData.features.main_subject}` : scenarioText);
    const videoPrompt = promptData.video_prompt || imagePrompt;

    let imageUrl = '';
    let videoUrl = null;
    let isPlaceholder = false;

    try {
      // Call Stability AI for image generation
      const formData = new FormData();
      formData.append('prompt', imagePrompt);
      formData.append('output_format', 'png');
      
      const stabilityResponse = await fetch('https://api.stability.ai/v2beta/stable-image/generate/ultra', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-AzClK681NVFCT9sNPtz4c8lOWiJ3bR7A0F4xzXbbI1sLw54D',
          'Accept': 'image/*'
        },
        body: formData
      });
      
      if (!stabilityResponse.ok) {
        // If payment error (402), provide a useful message and use fallback image
        if (stabilityResponse.status === 402) {
          console.warn('Stability AI API payment required. Using placeholder image.');
          
          // Create a placeholder image URL or use a hosted placeholder
          imageUrl = 'https://placehold.co/600x400/1a1a2e/e1e1e6?text=AI+Image+Preview+(API+Credits+Required)';
          isPlaceholder = true;
        } else {
          // For other errors, throw to be caught by the try/catch
          throw new Error(`Stability AI API request failed with status: ${stabilityResponse.status}`);
        }
      } else {
        // Process successful response
        const imageBlob = await stabilityResponse.blob();
        imageUrl = URL.createObjectURL(imageBlob);
        
        // Replace this section in your PromptForm.jsx where you handle video generation

// Step 5: Generate video if we have a valid image (not a placeholder)
if (!isPlaceholder) {
  // Update UI to show video generation is happening
  setGenerationStep('generating-video');
  
  try {
    // First fetch the image blob
    const imageBlob = await fetch(imageUrl).then(r => r.blob());
    
    // Convert the blob to base64
    const imageBase64 = await blobToBase64(imageBlob);
    
    // Now send the base64 data to our video generation endpoint
    const videoResponse = await fetch('/api/vid/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: imageBase64, // Send base64 data instead of URL
        videoPrompt: videoPrompt
      }),
    });
    
    if (!videoResponse.ok) {
      console.warn(`Video generation failed with status: ${videoResponse.status}`);
      // Continue without video, don't fail the whole process
    } else {
      // Process successful video response
      const videoBlob = await videoResponse.blob();
      videoUrl = URL.createObjectURL(videoBlob);
    }
  } catch (videoError) {
    console.error('Video generation error:', videoError);
    // Continue without video, don't fail the whole process
  }
}
      }
      
      // Combine all data for display
      const combinedResult = {
        parsed: {
          originalScenario: scenarioText,
          ...promptData,
          generatedAt: new Date().toISOString(),
          modelUsed: isPlaceholder ? 'stability-ultra (placeholder)' : 'stability-ultra',
          apiNote: isPlaceholder ? 'Stability AI credits needed for actual image generation' : ''
        },
        imageUrl,
        videoUrl,
        isPlaceholder
      };
      
      // Pass the result to the parent component
      onResult(combinedResult);
      setGenerationStep('complete');
      
    } catch (mediaError) {
      console.error('Media generation error:', mediaError);
      setError({
        error: 'Generation Failed',
        message: mediaError.message || 'Unable to generate media',
        reason: 'An error occurred during image or video generation.'
      });
      setGenerationStep('input');
    }
    
  } catch (err) {
    console.error('Error in generation process:', err);
    setError({
      error: 'Generation Error',
      message: err.message,
      reason: 'An error occurred during the generation process'
    });
    setGenerationStep('input');
  } finally {
    setLoading(false);
  }
};
  
  return (
    <div className={`${styles.formContainer} ${styles[generationStep]}`}>
      <form onSubmit={handleSubmit}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>Create AI-Generated Imagery</h2>
          <p className={styles.formDescription}>
            Describe a realistic scenario and we'll generate a beautiful image using AI
          </p>
        </div>
        
        <div className={styles.textareaWrapper}>
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="Describe a scene or scenario (e.g., 'A mountain climber reaching the summit at sunrise')"
            value={scenarioText}
            onChange={e => setScenarioText(e.target.value)}
            disabled={loading}
          />
          <div className={styles.textareaBackdrop}></div>
        </div>
        
        {error && (
          <div className={styles.errorContainer}>
            <div className={styles.errorReason}>{error.reason}</div>
            <div className={styles.errorMessage}>{error.message}</div>
          </div>
        )}
        
        <div className={styles.buttonContainer}>
          <button
            type="submit"
            disabled={loading || !scenarioText.trim()}
            className={`${styles.button} ${loading ? styles.loading : ''}`}
          >
            <span className={styles.buttonText}>
  {loading 
    ? generationStep === 'validating'
      ? 'Validating scenario...'
      : generationStep === 'processing' 
        ? 'Analyzing features...' 
        : generationStep === 'generating-video'
          ? 'Creating animation...'
          : 'Generating image...'
    : 'Generate Image & Video'
  }
</span>
            {loading && <span className={styles.spinner}></span>}
          </button>
        </div>
        
        {loading && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
            <div 
  className={styles.progressFill} 
  style={{ 
    width: generationStep === 'validating' 
      ? '20%' 
      : generationStep === 'processing' 
        ? '40%' 
        : generationStep === 'generating' 
          ? '60%' 
          : generationStep === 'generating-video'
            ? '80%'
            : '100%' 
  }}
></div>
            </div>
            <div className={styles.progressSteps}>
              <div className={`${styles.progressStep} ${styles.active}`}>
                <div className={styles.stepDot}></div>
                <span>Validate</span>
              </div>
              <div className={`${styles.progressStep} ${generationStep !== 'input' && generationStep !== 'validating' ? styles.active : ''}`}>
                <div className={styles.stepDot}></div>
                <span>Analyze</span>
              </div>
              <div className={`${styles.progressStep} ${generationStep === 'generating' || generationStep === 'complete' ? styles.active : ''}`}>
                <div className={styles.stepDot}></div>
                <span>Generate</span>
              </div>
            </div>
          </div>
        )}
                
        <div className={styles.footer}>
          Powered by <a href="https://stability.ai/" target="_blank" rel="noopener noreferrer">Stability AI</a> and <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">Google AI</a>
        </div>
      </form>
    </div>
  );
}