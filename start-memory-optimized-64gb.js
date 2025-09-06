#!/usr/bin/env node
/**
 * Memory-optimized startup script for Open SWE
 * Optimized for 64GB RAM systems with giant codebases (100GB+)
 */

// Set memory optimization flags for 64GB RAM system
// Conservative approach due to V8 platform limits on Windows
process.env.NODE_OPTIONS = [
  '--max-old-space-size=16384', // 16GB heap limit (conservative for Windows)
  '--max-semi-space-size=512',  // 512MB semi-space (reduced for stability)
  '--initial-old-space-size=2048', // 2GB initial (reduced startup)
  '--expose-gc', // Enable manual GC
  '--optimize-for-size', // Optimize for memory usage
  '--trace-warnings', // Show memory warnings
  '--trace-gc-verbose', // Detailed GC logging
  '--heap-prof', // Enable heap profiling
  '--max-http-header-size=80000', // Increase header size limit
].join(' ');

// Set environment variables for large codebase optimization
process.env.LG_REDACTING_SERDE = 'true';
process.env.LG_MEM_WATCHDOG = 'true';
process.env.LG_USE_WORKERS = 'true';
process.env.LG_STREAM_JSON = 'true';
process.env.LG_MAX_HEAP_SIZE = '49152';
process.env.LG_LARGE_CODEBASE_MODE = 'true';

console.log('🚀 Starting Open SWE with 64GB RAM optimization...');
console.log('📊 Memory limits:');
console.log('  - Heap: 48GB');
console.log('  - Document Cache: 500MB');
console.log('  - String Limits: 50MB');
console.log('  - Message History: 50MB (200 messages)');
console.log('');

// Import and start the application
require('./apps/open-swe/dist/server.js');
