import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileInput {
  name: string;
  content: string;
}

interface ClocResponse {
  totalNloc: number;
  languages: {
    [key: string]: {
      files: number;
      blank: number;
      comment: number;
      code: number;
    };
  };
}

// Security constants for input validation
const MAX_FILES = 500; // Maximum number of files allowed per request
const MAX_FILE_SIZE = 1024 * 1024; // 1MB per file
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total
const MAX_FILENAME_LENGTH = 255;
const N8N_TIMEOUT_MS = 30000; // 30 second timeout for n8n webhook

// Validate and sanitize file inputs
function validateFiles(files: FileInput[]): { valid: boolean; error?: string; sanitizedFiles?: FileInput[] } {
  // Check file count
  if (files.length > MAX_FILES) {
    return { valid: false, error: `Too many files. Maximum ${MAX_FILES} allowed, received ${files.length}.` };
  }
  
  let totalSize = 0;
  const sanitizedFiles: FileInput[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Validate file name exists and is a string
    if (!file.name || typeof file.name !== 'string') {
      return { valid: false, error: `Invalid file name at index ${i}` };
    }
    
    // Check filename length
    if (file.name.length > MAX_FILENAME_LENGTH) {
      return { valid: false, error: `File name too long at index ${i}. Maximum ${MAX_FILENAME_LENGTH} characters.` };
    }
    
    // Sanitize file name - remove path traversal attempts and shell-unsafe characters
    let sanitizedName = file.name
      .replace(/\.\.[\/\\]/g, '')      // Remove ../
      .replace(/^[\/\\]+/, '')         // Remove leading slashes
      .replace(/\s+/g, '_')            // Replace spaces with underscores
      .replace(/[<>:"|?*\x00-\x1f]/g, '_'); // Replace invalid/shell-unsafe characters
    
    // Check for path traversal after sanitization
    if (sanitizedName !== file.name) {
      console.warn(`File name sanitized from "${file.name}" to "${sanitizedName}"`);
    }
    
    // Ensure we have a valid name after sanitization
    if (!sanitizedName || sanitizedName.length === 0) {
      return { valid: false, error: `Invalid file name at index ${i} after sanitization` };
    }
    
    // Validate content is a string (empty strings are valid - they have 0 nLOC)
    if (typeof file.content !== 'string') {
      return { valid: false, error: `Invalid file content at index ${i} (expected string, got ${typeof file.content})` };
    }
    
    // Check individual file size
    const fileSize = new TextEncoder().encode(file.content).length;
    if (fileSize > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File "${sanitizedName}" exceeds ${MAX_FILE_SIZE / 1024}KB limit (${Math.round(fileSize / 1024)}KB).` 
      };
    }
    
    totalSize += fileSize;
    
    // Check total size early to fail fast
    if (totalSize > MAX_TOTAL_SIZE) {
      return { 
        valid: false, 
        error: `Total payload size exceeds ${MAX_TOTAL_SIZE / (1024 * 1024)}MB limit.` 
      };
    }
    
    sanitizedFiles.push({
      name: sanitizedName,
      content: file.content,
    });
  }
  
  return { valid: true, sanitizedFiles };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication to prevent anonymous abuse
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('cloc-estimate: Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('cloc-estimate: Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.warn('cloc-estimate: Invalid or expired token');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`cloc-estimate: Authenticated request from user ${user.id}`);

    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!n8nWebhookUrl) {
      console.error('cloc-estimate: N8N_WEBHOOK_URL is not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body with size limit check
    let requestBody: { files: FileInput[] };
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { files } = requestBody;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize input files
    const validation = validateFiles(files);
    if (!validation.valid) {
      console.warn(`Input validation failed: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${validation.sanitizedFiles!.length} files for CLOC estimation`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

    try {
      // Call n8n webhook with sanitized files and timeout
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: validation.sanitizedFiles }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error('n8n webhook error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to get CLOC estimate from processing service' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const clocResult: ClocResponse = await n8nResponse.json();
      
      console.log('CLOC result:', JSON.stringify(clocResult));

      return new Response(
        JSON.stringify(clocResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('n8n webhook timeout');
        return new Response(
          JSON.stringify({ error: 'Processing service timeout. Please try with fewer files.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('Error in cloc-estimate function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});