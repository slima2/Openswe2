#!/usr/bin/env node
/**
 * Memory-optimized startup script for Open SWE
 * Configures Node.js with optimal memory settings
 */

// Set memory optimization flags
process.env.NODE_OPTIONS = [
  '--max-old-space-size=8192', // 8GB heap limit
  '--expose-gc', // Enable manual GC
  '--optimize-for-size', // Optimize for memory usage
  '--trace-warnings', // Show memory warnings
].join(' ');

// Import and start the application
require('./apps/open-swe/dist/server.js');
