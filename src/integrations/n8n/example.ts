/**
 * Example of using n8n with Ollama in your application
 * 
 * This file demonstrates how to set up a workflow in n8n that connects to Ollama
 * and how to call it from your application.
 */

import { executeWorkflow } from './index';

/**
 * Process text using Ollama via n8n
 * 
 * Prerequisites:
 * 1. n8n must be running (started by your Electron app)
 * 2. You must create a workflow in n8n with a webhook trigger and Ollama node
 * 3. The workflow ID must be configured below
 * 
 * @param text The text to process with the AI model
 * @returns The AI-generated response
 */
export async function processWithOllama(text: string): Promise<string> {
  // This would be the ID of your n8n workflow with webhook
  // You'll need to create this workflow in the n8n UI
  const WORKFLOW_ID = 'your-workflow-id';
  
  try {
    const response = await executeWorkflow(WORKFLOW_ID, {
      text,
      model: 'llama3', // or whatever model you're using
      options: {
        temperature: 0.7,
        max_tokens: 500
      }
    });
    
    return response.result || 'No response from AI';
  } catch (error) {
    console.error('Error processing with Ollama via n8n:', error);
    throw error;
  }
}

/**
 * How to set up the n8n workflow:
 * 
 * 1. Open n8n UI at http://localhost:5678/
 * 2. Create a new workflow
 * 3. Add a Webhook node as the trigger
 * 4. Configure it as follows:
 *    - Authentication: None
 *    - HTTP Method: POST
 *    - Response Mode: Last Node
 * 5. Add an HTTP Request node
 *    - URL: http://localhost:11434/api/generate (Ollama API)
 *    - Method: POST
 *    - Authentication: None
 *    - JSON/RAW Parameters: 
 *      {
 *        "model": "{{$json.model}}",
 *        "prompt": "{{$json.text}}",
 *        "temperature": "{{$json.options.temperature}}",
 *        "max_tokens": "{{$json.options.max_tokens}}"
 *      }
 * 6. Connect the Webhook node to the HTTP Request node
 * 7. Save and activate the workflow
 * 8. Copy the webhook URL - this will contain your workflow ID
 * 
 * Now you can use the processWithOllama function in your app!
 */ 