# WSL2 Setup for Open SWE on Windows

## Overview

Open SWE now supports running Linux commands on Windows through WSL2 (Windows Subsystem for Linux 2). This allows the system to execute native Linux commands without translation, providing better compatibility and reliability.

## Prerequisites

### 1. Install WSL2

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

This command will:
- Enable the WSL feature
- Install Ubuntu as the default distribution
- Restart your computer if needed

### 2. Verify WSL2 Installation

After installation, verify WSL2 is working:

```powershell
wsl --status
```

You should see information about your WSL version and default distribution.

## How It Works

### Automatic Detection

The modified LocalShellExecutor automatically:

1. **Detects Windows Platform**: Checks if running on Windows
2. **Checks WSL2 Availability**: Tests if WSL2 is installed and accessible
3. **Path Conversion**: Automatically converts paths between Windows and WSL formats
   - Windows: `C:\Users\slima\open-swe-projects\myproject`
   - WSL: `/mnt/c/Users/slima/open-swe-projects/myproject`

### Command Execution Flow

When a command is executed on Windows:

1. **With WSL2 Available**:
   - Commands are wrapped in `wsl bash -c "command"`
   - Paths are converted to WSL format
   - Linux commands run natively in WSL2

2. **Without WSL2** (Fallback):
   - Commands run through Windows CMD
   - Limited compatibility with Linux-specific commands

## Implementation Details

### Modified Files

1. **`apps/open-swe/src/utils/shell-executor/local-shell-executor.ts`**
   - Added WSL2 detection (`checkWSLAvailable()`)
   - Added path conversion (`convertToWSLPath()`)
   - Modified command execution to use WSL2 when available

### Key Functions

```typescript
// Check if WSL2 is available
private checkWSLAvailable(): boolean {
  try {
    execSync('wsl --status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Convert Windows path to WSL path
private convertToWSLPath(windowsPath: string): string {
  // C:\Users\... -> /mnt/c/Users/...
  const normalized = windowsPath.replace(/\\/g, '/');
  const match = normalized.match(/^([a-zA-Z]):\/(.*)/);
  if (match) {
    const drive = match[1].toLowerCase();
    const path = match[2];
    return `/mnt/${drive}/${path}`;
  }
  return normalized;
}
```

## Testing the Setup

### 1. Restart Open SWE Servers

Stop all running servers and restart:

```powershell
# Stop all Node processes
Get-Process node | Stop-Process -Force

# Rebuild the project
cd D:\Dropbox\EDUCASTLE\OPENSWE2\open-swe-main
node yarn.js build

# Start the API server
cd apps\open-swe
node ..\..\yarn.js dev

# In another terminal, start the web server
cd apps\web
node ..\..\yarn.js dev
```

### 2. Test Command Execution

The system will now:
- Use WSL2 for executing Linux commands
- Automatically handle path conversions
- Fall back to CMD if WSL2 is not available

## Troubleshooting

### WSL2 Not Detected

If you see "WSL2 not available" in logs:

1. Ensure WSL2 is installed: `wsl --install`
2. Check WSL version: `wsl --list --verbose`
3. Set WSL2 as default: `wsl --set-default-version 2`
4. Restart your computer

### Path Issues

If paths are not being converted correctly:

1. Check the logs for path conversion messages
2. Ensure project directories exist in Windows
3. Verify WSL can access Windows drives: `wsl ls /mnt/c`

### Command Failures

If commands still fail:

1. Test the command directly in WSL: `wsl bash -c "your_command"`
2. Check for missing dependencies in WSL
3. Install required tools in WSL:
   ```bash
   wsl sudo apt update
   wsl sudo apt install -y git build-essential nodejs npm
   ```

## Benefits of WSL2 Integration

1. **Native Linux Commands**: Run bash, grep, sed, awk, etc. without modification
2. **Better Compatibility**: No need to translate commands for Windows
3. **Improved Performance**: WSL2 runs a real Linux kernel
4. **Seamless Path Handling**: Automatic conversion between Windows and WSL paths
5. **Fallback Support**: Still works without WSL2 (limited functionality)

## Next Steps

1. **Install Development Tools in WSL**:
   ```bash
   wsl bash -c "sudo apt update && sudo apt install -y git nodejs npm python3 python3-pip"
   ```

2. **Configure Git in WSL**:
   ```bash
   wsl bash -c "git config --global user.name 'Your Name'"
   wsl bash -c "git config --global user.email 'your.email@example.com'"
   ```

3. **Test the System**: Try creating a new project through the Open SWE web interface

## Additional Resources

- [WSL2 Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [WSL2 Installation Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
- [WSL2 Best Practices](https://docs.microsoft.com/en-us/windows/wsl/best-practices)
