// server/server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));  // Increase JSON payload limit to 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const PORT = process.env.PORT || 4000;

// API keys
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyD-uJ9ZvaJC5l3PZdhBhjOn5r2U3soGMtg';
// const STABILITY_API_KEY = process.env.STABILITY_API_KEY || 'sk-wMyyh1HT9UL1o2SHSCXkOzMGbBR4h4g6q567MzHaNhD76Y9U';

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize Google GenAI
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

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

// import fetch from 'node-fetch';
// import FormData from 'form-data';
import axios from 'axios';
import { Buffer } from 'buffer';

// Replace your current /api/vid/generate endpoint with this updated one

app.post('/api/vid/generate', async (req, res) => {
  try {
    const { imageData, videoPrompt } = req.body;
    
    if (!imageData || !videoPrompt) {
      return res.status(400).json({ 
        error: 'Missing required parameters', 
        message: 'Both imageData and videoPrompt are required' 
      });
    }
    
    console.log('Starting video generation with prompt:', videoPrompt);
    
    // Check if we have a valid base64 image
    if (!imageData.startsWith('data:image')) {
      return res.status(400).json({
        error: 'Invalid image data',
        message: 'Image data must be in base64 format'
      });
    }
    
    // Extract the base64 part (remove the data:image/... prefix)
    const base64Data = imageData.split(',')[1];
    
    // Set up the API key - use your latest key (consider using environment variables)
    const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY || "SG_c4093fadf0d7a7ef";
    
    // Set up the request data for wan2.1-i2v-480p model
    const data = {
      "prompt": videoPrompt,
      "negative_prompt": "blurry, bad quality, camera shake, distortion, poor composition, low resolution, artifact, watermark",
      "image": base64Data,
      "seed": Math.floor(Math.random() * 100000000), // Random seed
      "video_length": 3,
      "resolution": 480,
      "steps": 30,
      "base64": false
    };
    
    // Setup headers with API key
    const headers = {
      'x-api-key': SEGMIND_API_KEY,
      'Content-Type': 'application/json'
    };
    
    // Make the request to Segmind's wan2.1-i2v-480p API endpoint
    console.log('Sending request to Segmind wan2.1-i2v-480p API...');
    
    // Add retry logic with exponential backoff for rate limiting
    const MAX_RETRIES = 2;
    let retryCount = 0;
    let segmindResponse;
    
    while (retryCount <= MAX_RETRIES) {
      try {
        console.log(`API call attempt ${retryCount + 1}`);
        
        segmindResponse = await axios.post(
          'https://api.segmind.com/v1/wan2.1-i2v-480p',
          data,
          { headers, responseType: 'arraybuffer' }
        );
        
        // If we got here, the request was successful
        break;
      } catch (apiError) {
        if (apiError.response && apiError.response.status === 429) {
          // Rate limit error - try again after backoff if we haven't hit max retries
          retryCount++;
          
          if (retryCount <= MAX_RETRIES) {
            const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s
            console.log(`Rate limited. Waiting ${backoffTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            // We've exhausted our retries
            return res.status(429).json({
              error: 'Rate limit exceeded',
              message: 'The video generation API is currently rate limited. Please try again later.'
            });
          }
        } else {
          // Other error - don't retry
          throw apiError;
        }
      }
    }
    
    if (!segmindResponse || segmindResponse.status !== 200) {
      throw new Error(`Segmind API failed after ${MAX_RETRIES + 1} attempts`);
    }
    
    // Return the video data
    res.set('Content-Type', 'video/mp4');
    return res.send(Buffer.from(segmindResponse.data));
    
  } catch (error) {
    console.error('Video generation error:', error);
    
    // Enhanced error information
    let statusCode = 500;
    const errorResponse = {
      error: 'Video generation failed',
      message: error.message || 'An error occurred during video generation'
    };
    
    // Add more specific error details if available
    if (error.response) {
      statusCode = error.response.status;
      errorResponse.statusCode = error.response.status;
      
      // For specific error handling
      if (error.response.status === 413) {
        errorResponse.message = 'The image file is too large. Please use a smaller image.';
      } else if (error.response.status === 400) {
        errorResponse.message = 'The request was invalid. Please check your inputs.';
      }
    }
    
    return res.status(statusCode).json(errorResponse);
  }
});

// Replace the existing /api/validate route with this improved version
app.post('/api/validate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Use Gemini model for validation
    const validationModel = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0, // Zero temperature for deterministic responses
        topP: 0.1,      // Lower topP for higher precision 
        topK: 1         // Lowest topK for highest precision
      }
    });
    
    const validationResult = await validationModel.generateContent(prompt);
    const validationResponse = await validationResult.response;
    const validationText = validationResponse.text();
    
    try {
      // Extract JSON from markdown code blocks or directly parse
      let jsonText = validationText;

      // Remove markdown code blocks if present
      const codeBlockMatch = validationText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        jsonText = codeBlockMatch[1].trim();
      }
      
      // Try to parse the extracted JSON
      const parsed = JSON.parse(jsonText);
      return res.json(parsed);
    } catch (parseError) {
      console.error('Validation parsing error:', parseError);
      
      // Fallback approach: look for JSON-like structure using regex
      try {
        const jsonPattern = /\{[\s\S]*"is_possible"[\s\S]*\}/;
        const match = validationText.match(jsonPattern);
        
        if (match) {
          // Try to clean and parse the matched text
          const cleanedJSON = match[0]
            .replace(/```[a-z]*|\s*```/g, '')  // Remove markdown tags
            .replace(/[\u201C\u201D]/g, '"');  // Replace smart quotes
          
          const fallbackParsed = JSON.parse(cleanedJSON);
          return res.json(fallbackParsed);
        }
      } catch (fallbackError) {
        console.error('Fallback parsing error:', fallbackError);
      }
      
      // If all parsing attempts fail, return a default response
      return res.json({ 
        is_possible: true, 
        note: "Validation parsing failed, proceeding with caution" 
      });
    }
  } catch (error) {
    console.error('Error in validation:', error);
    return res.status(500).json({ 
      error: 'Validation failed', 
      message: error.message 
    });
  }
});


app.post('/api/audio/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Missing required parameter', 
        message: 'Audio prompt is required' 
      });
    }
    
    console.log('Starting audio generation with prompt:', prompt);
    
    // Use Stability AI API for audio generation
    const STABILITY_API_KEY = process.env.STABILITY_API_KEY || 'sk-AzClK681NVFCT9sNPtz4c8lOWiJ3bR7A0F4xzXbbI1sLw54D';

    // Create form data
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', 'mp3');
    formData.append('duration', '3');
    formData.append('steps', '30');
    
    // Make the request using axios
    const audioResponse = await axios.post(
      'https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${STABILITY_API_KEY}`,
          'Accept': 'audio/*',
          ...formData.getHeaders() // This automatically sets the correct Content-Type with boundary
        },
        responseType: 'arraybuffer'
      }
    );
    
    // Return the audio data
    res.set('Content-Type', 'audio/mpeg');
    return res.send(Buffer.from(audioResponse.data));
    
  } catch (error) {
    console.error('Audio generation error:', error);
    
    // Error response with more detailed info
    if (error.response) {
      const errorMessage = error.response.data instanceof Buffer 
        ? Buffer.from(error.response.data).toString() 
        : JSON.stringify(error.response.data);
      
      console.error('API error response:', errorMessage);
      
      return res.status(error.response.status).json({
        error: 'Audio generation failed',
        message: errorMessage,
        status: error.response.status
      });
    }
    
    return res.status(500).json({ 
      error: 'Audio generation failed', 
      message: error.message || 'An error occurred during audio generation'
    });
  }
});

// The previous version had a parsing issue and an unreachable code error
app.post('/api/generate', async (req, res) => {
  try {
    const { scenario_text, analysis_prompt } = req.body;

    if (!scenario_text) {
      return res.status(400).json({ error: 'scenario_text is required' });
    }

    // Quick pattern-based pre-filtering
    for (const pattern of IMPOSSIBLE_PATTERNS) {
      if (pattern.test(scenario_text)) {
        return res.status(400).json({
          error: 'Impossible scenario',
          reason: 'The scenario contains elements that cannot be visualized',
          message: 'Please provide a scenario that can be reasonably depicted in an image or video'
        });
      }
    }

    // Use provided analysis prompt or default to our structured one
    const promptToUse = analysis_prompt || `
You are a creative AI assistant.

Analyze the following scenario carefully: "${scenario_text}"

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

Respond ONLY in the following pure JSON format WITHOUT any markdown formatting or code blocks:

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

    // Use Gemini model for generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent(promptToUse);
    const response = await result.response;
    const text = response.text();

    // Extract JSON, handling potential markdown code blocks
    let jsonText = text;
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      jsonText = codeBlockMatch[1].trim();
    }

    // Attempt to parse JSON response
    try {
      const parsed = JSON.parse(jsonText);
      
      // Add original scenario for reference
      parsed.originalScenario = scenario_text;
      
      return res.json(parsed);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      
      // Fall back to manual extraction
      const parsedData = {
        originalScenario: scenario_text,
        rawResponse: text,
        features: {},
        image_prompt: '',
        video_prompt: ''
      };

      // Helper to extract a JSON block for a given key
      function extractBlock(key) {
        const idx = text.indexOf(`"${key}"`);
        if (idx === -1) return null;
        const start = text.indexOf('{', idx);
        if (start === -1) return null;
        let depth = 0;
        for (let i = start; i < text.length; i++) {
          if (text[i] === '{') depth++;
          else if (text[i] === '}') depth--;
          if (depth === 0) {
            return text.substring(start, i + 1);
          }
        }
        return null;
      }

      // Extract features block
      const featBlock = extractBlock('features');
      if (featBlock) {
        try {
          parsedData.features = JSON.parse(featBlock);
        } catch (e) {
          console.error('Failed to parse features block:', e);
        }
      }

      // Extract image_prompt via regex
      const ip = text.match(/"image_prompt"\s*:\s*"([^"]*)"/);
      if (ip) parsedData.image_prompt = ip[1];

      // Extract video_prompt via regex
      const vp = text.match(/"video_prompt"\s*:\s*"([^"]*)"/);
      if (vp) parsedData.video_prompt = vp[1];

      // Return the assembled object
      return res.json(parsedData);
    }
  } catch (error) {
    console.error('Error generating prompts:', error);
    return res.status(500).json({ 
      error: 'Generation failed', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at /api/generate and /api/validate`);
});