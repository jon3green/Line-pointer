# Cursor AI + GitHub Setup Guide

## Quick Setup (3 Steps)

### Step 1: Open Your Project in Cursor AI
```bash
# If Cursor CLI is installed:
cursor /Users/jongreen/sports-prediction-app

# Or manually:
# - Launch Cursor AI application
# - File → Open Folder → Navigate to /Users/jongreen/sports-prediction-app
```

### Step 2: Sign in to GitHub in Cursor
1. Click the **Account icon** (bottom left corner, looks like a person)
2. Click **"Sign in with GitHub"**
3. This will open your browser for GitHub authentication
4. Authorize Cursor AI to access your GitHub account
5. You'll be redirected back to Cursor

### Step 3: Verify Git Integration
Once signed in, you'll see:
- Your GitHub avatar in the bottom left
- Git panel in the left sidebar (Source Control icon)
- Ability to commit, push, pull directly from Cursor

## Using Git in Cursor AI

### Visual Git Panel (Left Sidebar)
- **Source Control icon** (branching symbol) shows:
  - Modified files
  - Staged changes
  - Commit history

### Quick Actions
- **Stage files**: Click `+` next to file
- **Commit**: Enter message and click ✓
- **Push**: Click `...` menu → Push
- **Pull**: Click `...` menu → Pull
- **Branch**: Click branch name at bottom to switch/create branches

### Keyboard Shortcuts
- `Cmd+Shift+G` - Open Source Control panel
- `Cmd+K` - Open AI chat
- `Cmd+L` - Open AI inline editing
- `Cmd+\`` - Toggle integrated terminal

## Current Project Status

**Repository**: https://github.com/jon3green/Line-pointer
**Branch**: main
**Last Commit**: 43f9479 (Fix: Apply modern Line Pointer styling)

**Vercel**: https://sports-prediction-jdldbgzbq-jongreen716-7177s-projects.vercel.app

## Workflow

1. **Make changes** in Cursor AI editor
2. **Stage changes** in Git panel (left sidebar)
3. **Write commit message** at top of Git panel
4. **Click ✓ to commit**
5. **Click ... → Push** to push to GitHub
6. **Vercel auto-deploys** your changes (no manual deploy needed!)

## Troubleshooting

### If GitHub Sign-in Doesn't Work
Your GitHub CLI is already authenticated, so Cursor will use those credentials automatically.

### If You Need to Re-authenticate
```bash
gh auth login
```

### Check Git Status in Terminal
```bash
# In Cursor's integrated terminal (Cmd+`)
git status
git log --oneline -5
```

## Your GitHub Credentials

Already configured:
- **Name**: Jon Green
- **Email**: jonathan3green@gmail.com
- **GitHub Account**: jon3green
- **Auth Method**: GitHub CLI (gh)
- **SSH Key**: Configured (id_ed25519)

## Ready to Go!

Everything is configured. Just:
1. Open Cursor AI
2. Sign in with GitHub (one time)
3. Start coding!

All your commits and pushes will automatically sync with GitHub, and Vercel will automatically deploy your changes.
