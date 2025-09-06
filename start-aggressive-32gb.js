#!/usr/bin/env node
/**
 * AGGRESSIVE: 32GB heap limit
 * Maximum performance but higher risk on some platforms
 * Use only if you have confirmed V8 can handle this on your system
 */

process.env.NODE_OPTIONS = [
  '--max-old-space-size=32768',  // 32GB heap (aggressive)
  '--max-semi-space-size=1024',  // 1GB semi-space
  '--initial-old-space-size=4096', // 4GB initial
  '--expose-gc',
  '--optimize-for-size',
  '--trace-warnings',
  '--heap-prof',                 // Heap profiling for monitoring
  '--max-http-header-size=80000', // Larger headers
].join(' ');

process.env.LG_REDACTING_SERDE = 'true';
process.env.LG_MEM_WATCHDOG = 'true';
process.env.LG_USE_WORKERS = 'true';
process.env.LG_STREAM_JSON = 'true';
process.env.LG_MAX_HEAP_SIZE = '32768';
process.env.LG_LARGE_CODEBASE_MODE = 'true';

// Full limits for aggressive mode
process.env.LG_DOCUMENT_CACHE_SIZE = '500'; // 500MB
process.env.LG_STRING_LIMIT = '50';         // 50MB
process.env.LG_MESSAGE_LIMIT = '50';        // 50MB

console.log('🚀 Starting Open SWE in AGGRESSIVE mode (32GB heap)...');
console.log('⚠️  WARNING: This mode pushes V8 limits - monitor for crashes');
console.log('📊 Memory limits:');
console.log('  - Heap: 32GB');
console.log('  - Document Cache: 500MB');
console.log('  - String Limits: 50MB');
console.log('  - Message History: 50MB');
console.log('');

require('./apps/open-swe/dist/server.js');
