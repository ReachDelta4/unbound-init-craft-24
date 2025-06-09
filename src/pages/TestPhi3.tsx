import React, { useState } from 'react';
import { usePhi3Context } from '@/contexts/Phi3Context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const TestPhi3: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const {
    isLoading,
    isInitialized,
    processTranscriptSegment,
    generateResponse,
    lastResponse,
    lastSummary
  } = usePhi3Context();
  
  const handleProcessTranscript = () => {
    try {
      processTranscriptSegment(input);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };
  
  const handleGenerateResponse = async () => {
    try {
      const result = await generateResponse(input);
      setResponse(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Phi-3 Integration Test</h1>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Input</span>
              <div>
                <Badge variant={isInitialized ? 'success' : 'destructive'}>
                  {isInitialized ? 'Initialized' : 'Not Initialized'}
                </Badge>
                {isLoading && (
                  <Badge variant="outline" className="ml-2">Loading...</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to process..."
              className="mb-4"
              rows={5}
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={handleProcessTranscript}
                disabled={!input.trim() || isLoading || !isInitialized}
              >
                Process as Transcript
              </Button>
              
              <Button 
                onClick={handleGenerateResponse}
                disabled={!input.trim() || isLoading || !isInitialized}
                variant="outline"
              >
                Generate Response
              </Button>
            </div>
            
            {error && (
              <div className="mt-4 p-2 bg-red-100 text-red-800 rounded">
                Error: {error}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {response && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Direct Response:</h3>
                  <div className="text-sm whitespace-pre-wrap p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {response}
                  </div>
                </div>
              )}
              
              {lastResponse && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Last Insights:</h3>
                  <div className="text-sm whitespace-pre-wrap p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {lastResponse}
                  </div>
                </div>
              )}
              
              {lastSummary && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Last Summary:</h3>
                  <div className="text-sm whitespace-pre-wrap p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {lastSummary}
                  </div>
                </div>
              )}
              
              {!response && !lastResponse && !lastSummary && (
                <div className="text-sm text-muted-foreground">
                  No response generated yet. Enter some text and click one of the buttons.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPhi3; 