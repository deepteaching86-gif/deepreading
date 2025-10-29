# Scripts Directory

Automation scripts for the Literacy Test Project.

## 📁 Files

### `update-render-env.ts`
Playwright automation script to update Render dashboard environment variables.

**Purpose**: Automatically logs in to Render, navigates to the service, and updates environment variables (DATABASE_URL, JWT_SECRET, NODE_ENV).

**Documentation**: See [PLAYWRIGHT_GUIDE.md](PLAYWRIGHT_GUIDE.md) for detailed usage instructions.

**Quick Start**:
```bash
# Install dependencies (if not already done)
npm install

# Set credentials
set RENDER_EMAIL=your@email.com
set RENDER_PASSWORD=yourpassword

# Run automation
npm run render:update-env
```

### `PLAYWRIGHT_GUIDE.md`
Complete guide for running the Playwright automation script.

**Contains**:
- Installation instructions
- Usage examples (Windows, Linux, Mac)
- Step-by-step execution flow
- Troubleshooting guide
- Security recommendations

## 🔒 Security

**Important**:
- Never commit `.env.local` files containing credentials
- Use environment variables for sensitive information
- Clear environment variables after use
- See [PLAYWRIGHT_GUIDE.md](PLAYWRIGHT_GUIDE.md) for security best practices

## 🎯 Use Cases

### Render Environment Variable Updates
When manual dashboard updates fail or need automation:
1. Use `update-render-env.ts` to automate the process
2. Script handles login, navigation, and variable updates
3. Automatically triggers redeployment
4. Provides verification of deployment status

### When to Use Manual Methods
If automation fails or is unavailable:
- Refer to [../RENDER_FIX_GUIDE.md](../RENDER_FIX_GUIDE.md) for manual instructions
- See [../DEPLOY_INSTRUCTIONS.md](../DEPLOY_INSTRUCTIONS.md) for Python backend deployment

## 📊 Performance

| Method | Time | Reliability | User Input |
|--------|------|-------------|------------|
| Automated (Playwright) | 2-3 min | High | Minimal |
| Manual Dashboard | 5-10 min | Medium | High |

## 🆘 Troubleshooting

### Common Issues

**Error: "RENDER_EMAIL and RENDER_PASSWORD are required"**
- Set environment variables before running script
- See PLAYWRIGHT_GUIDE.md for platform-specific instructions

**Error: "Timeout waiting for selector"**
- Render UI may have changed
- Check render-error-screenshot.png for debugging
- Increase timeout values in script

**Browser not opening**
- Run: `npx playwright install chromium`
- Ensure sufficient disk space for browser installation

### Getting Help
1. Check [PLAYWRIGHT_GUIDE.md](PLAYWRIGHT_GUIDE.md) troubleshooting section
2. Review error screenshots in project root
3. Verify Render credentials are correct
4. Check Render service logs for deployment status

## 🔄 Future Enhancements

Potential improvements for automation scripts:
- [ ] Add support for multiple services
- [ ] Implement retry logic for transient failures
- [ ] Add screenshot capture for successful operations
- [ ] Create Python backend deployment automation
- [ ] Add environment variable validation
- [ ] Implement rollback capability
