#!/usr/bin/env node
/**
 * CONSERVATIVE: 8GB heap limit
 * Use this if you're experiencing crashes with higher limits
 */

process.env.NODE_OPTIONS = [
  '--max-old-space-size=8192',   // 8GB heap (very safe)
  '--max-semi-space-size=256',   // 256MB semi-space
  '--initial-old-space-size=1024', // 1GB initial
  '--expose-gc',
  '--optimize-for-size',
  '--trace-warnings',
].join(' ');

// More aggressive memory optimization for smaller heap
process.env.LG_REDACTING_SERDE = 'true';
process.env.LG_MEM_WATCHDOG = 'true';
process.env.LG_USE_WORKERS = 'true';
process.env.LG_STREAM_JSON = 'true';
process.env.LG_MAX_HEAP_SIZE = '8192';
process.env.LG_LARGE_CODEBASE_MODE = 'true';

// Smaller limits for conservative mode
process.env.LG_DOCUMENT_CACHE_SIZE = '100'; // 100MB instead of 500MB
process.env.LG_STRING_LIMIT = '10';         // 10MB instead of 50MB
process.env.LG_MESSAGE_LIMIT = '20';        // 20MB instead of 50MB

console.log('🛡️  Starting Open SWE in CONSERVATIVE mode (8GB heap)...');
console.log('📊 Memory limits:');
console.log('  - Heap: 8GB');
console.log('  - Document Cache: 100MB');
console.log('  - String Limits: 10MB');
console.log('  - Message History: 20MB');
console.log('');

require('./apps/open-swe/dist/server.js');
