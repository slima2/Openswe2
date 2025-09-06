#!/usr/bin/env node
/**
 * MODERATE: 16GB heap limit
 * Good balance between performance and stability
 */

process.env.NODE_OPTIONS = [
  '--max-old-space-size=16384',  // 16GB heap (balanced)
  '--max-semi-space-size=512',   // 512MB semi-space
  '--initial-old-space-size=2048', // 2GB initial
  '--expose-gc',
  '--optimize-for-size',
  '--trace-warnings',
  '--trace-gc',                  // Basic GC logging
].join(' ');

process.env.LG_REDACTING_SERDE = 'true';
process.env.LG_MEM_WATCHDOG = 'true';
process.env.LG_USE_WORKERS = 'true';
process.env.LG_STREAM_JSON = 'true';
process.env.LG_MAX_HEAP_SIZE = '16384';
process.env.LG_LARGE_CODEBASE_MODE = 'true';

// Moderate limits
process.env.LG_DOCUMENT_CACHE_SIZE = '250'; // 250MB
process.env.LG_STRING_LIMIT = '25';         // 25MB
process.env.LG_MESSAGE_LIMIT = '35';        // 35MB

console.log('⚖️  Starting Open SWE in MODERATE mode (16GB heap)...');
console.log('📊 Memory limits:');
console.log('  - Heap: 16GB');
console.log('  - Document Cache: 250MB');
console.log('  - String Limits: 25MB');
console.log('  - Message History: 35MB');
console.log('');

require('./apps/open-swe/dist/server.js');
