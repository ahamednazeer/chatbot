# Voice Features Troubleshooting Guide

## Common Issues and Solutions

### 1. Network Error (Most Common)

**Error Message:** "Network error. Speech recognition requires an internet connection."

**Cause:** The Web Speech API in Chrome/Edge uses Google's cloud-based speech recognition service, which requires an active internet connection.

**Solutions:**

#### Check Your Internet Connection
1. Verify you're connected to the internet
2. Try opening another website to confirm connectivity
3. Check if you're behind a firewall or proxy that might block the speech API

#### Browser-Specific Solutions

**Chrome/Edge:**
- The speech recognition API requires internet access
- Make sure you're not in offline mode
- Check if your network allows connections to Google services
- Try disabling VPN if you're using one

**Safari:**
- Safari uses Apple's speech recognition
- May work offline on macOS/iOS devices
- Ensure you have the latest Safari version

**Firefox:**
- Limited support for Web Speech API
- May not work reliably
- Consider using Chrome or Edge for voice features

#### Workarounds
1. **Use Safari** (if on macOS/iOS) - it has better offline support
2. **Check Network Settings** - ensure your firewall isn't blocking the API
3. **Try a Different Network** - corporate networks may block speech APIs
4. **Use Mobile Hotspot** - if your main network has restrictions

---

### 2. Microphone Access Denied

**Error Message:** "Microphone access denied. Please enable it in your browser settings."

**Solutions:**

#### Chrome/Edge
1. Click the lock icon in the address bar
2. Find "Microphone" in the permissions list
3. Change it to "Allow"
4. Refresh the page

#### Safari
1. Go to Safari → Settings → Websites → Microphone
2. Find your site and set to "Allow"
3. Refresh the page

#### Firefox
1. Click the lock icon in the address bar
2. Click "More Information"
3. Go to Permissions tab
4. Find "Use the Microphone" and uncheck "Use Default"
5. Select "Allow"
6. Refresh the page

---

### 3. No Speech Detected

**Error Message:** "No speech detected. Please try again."

**Causes:**
- Microphone not working
- Speaking too quietly
- Background noise
- Wrong microphone selected

**Solutions:**
1. **Test Your Microphone:**
   - Go to your system settings
   - Test the microphone to ensure it's working
   - Adjust the input volume

2. **Speak Clearly:**
   - Speak at normal volume
   - Reduce background noise
   - Position microphone closer to your mouth

3. **Select Correct Microphone:**
   - Check system settings for default microphone
   - If using external mic, ensure it's properly connected
   - Try unplugging and reconnecting the microphone

4. **Browser Settings:**
   - Check if the correct microphone is selected in browser settings
   - Chrome: Settings → Privacy and Security → Site Settings → Microphone

---

### 4. Speech Recognition Not Available

**Error Message:** "Speech recognition not available in this browser"

**Cause:** Your browser doesn't support the Web Speech API

**Solutions:**
1. **Update Your Browser:**
   - Ensure you're using the latest version
   - Chrome, Edge, Safari, and Opera have the best support

2. **Switch Browsers:**
   - **Recommended:** Chrome or Edge (best support)
   - **Good:** Safari (especially on macOS/iOS)
   - **Limited:** Firefox (experimental support)

3. **Check Browser Compatibility:**
   - Chrome 25+ ✅
   - Edge 79+ ✅
   - Safari 14.1+ ✅
   - Opera 27+ ✅
   - Firefox 🟡 (limited/experimental)

---

### 5. Text-to-Speech Not Working

**Symptoms:** Speaker button doesn't work or no sound plays

**Solutions:**

1. **Check System Volume:**
   - Ensure system volume is not muted
   - Check browser tab is not muted (look for speaker icon on tab)

2. **Check Browser Permissions:**
   - Some browsers may block autoplay audio
   - Try clicking the speaker button again

3. **Reload Voices:**
   - Refresh the page
   - Voices may take a moment to load on first page load

4. **Browser-Specific Issues:**
   - **Chrome/Edge:** Usually works well
   - **Safari:** May need user interaction first
   - **Firefox:** Check if audio is enabled in settings

---

### 6. Voice Input Stops Immediately

**Symptoms:** Recording starts but stops right away

**Causes:**
- Network interruption
- Microphone access revoked
- Browser bug

**Solutions:**
1. **Check Network Stability:**
   - Ensure stable internet connection
   - Avoid switching networks while recording

2. **Restart Recognition:**
   - Click the microphone button again
   - Wait a moment before speaking

3. **Clear Browser Cache:**
   - Clear cache and cookies
   - Restart browser
   - Try again

---

### 7. HTTPS Required Error

**Error Message:** "Speech recognition requires HTTPS"

**Cause:** Web Speech API requires a secure connection (HTTPS) except for localhost

**Solutions:**
1. **For Development:**
   - Use `http://localhost` or `http://127.0.0.1` (these are allowed)
   - No HTTPS needed for local development

2. **For Production:**
   - Deploy with HTTPS enabled
   - Use services like Let's Encrypt for free SSL certificates
   - Most hosting providers offer free SSL

---

## Best Practices

### For Best Voice Recognition Results:

1. **Environment:**
   - Use in a quiet environment
   - Minimize background noise
   - Close windows to reduce outside noise

2. **Microphone:**
   - Use a good quality microphone
   - Position 6-12 inches from your mouth
   - Avoid touching or moving the microphone while speaking

3. **Speaking:**
   - Speak clearly and at normal pace
   - Use natural speech patterns
   - Pause briefly between sentences

4. **Network:**
   - Ensure stable internet connection
   - Avoid using on slow/unreliable networks
   - Consider using wired connection for best results

### For Best Text-to-Speech Results:

1. **Content:**
   - The system automatically removes code blocks and markdown
   - Long messages may take a moment to start

2. **Control:**
   - Click speaker button again to stop playback
   - Only one message can play at a time

---

## Technical Details

### Network Requirements

The Web Speech API (specifically `SpeechRecognition`) in Chrome/Edge requires:
- Active internet connection
- Access to Google's speech recognition servers
- Ports: Standard HTTPS (443)
- No proxy/firewall blocking Google services

### Why Internet is Required

**Chrome/Edge:**
- Uses Google Cloud Speech-to-Text API
- Processes audio on Google's servers
- Provides high accuracy but requires internet

**Safari:**
- Uses Apple's speech recognition
- May work offline on Apple devices
- Processes locally when possible

### Privacy Considerations

When using voice input:
- Audio is sent to cloud services (Chrome/Edge)
- No audio is stored by this application
- Transcribed text is treated as normal input
- Check your browser's privacy policy for details

---

## Still Having Issues?

### Debug Steps:

1. **Open Browser Console:**
   - Press F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
   - Go to Console tab
   - Look for error messages

2. **Check Network Tab:**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Try voice input
   - Look for failed requests

3. **Test Basic Functionality:**
   ```javascript
   // Test in browser console
   const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
   recognition.start();
   ```

4. **Check Browser Support:**
   ```javascript
   // Test in browser console
   console.log('SpeechRecognition:', 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
   console.log('SpeechSynthesis:', 'speechSynthesis' in window);
   ```

### Report Issues:

If you continue to experience problems:
1. Note your browser version
2. Note your operating system
3. Describe the exact error message
4. Include console errors if any
5. Describe steps to reproduce

---

## Alternative Solutions

If voice features don't work in your environment:

1. **Use Different Browser:**
   - Try Chrome, Edge, or Safari
   - Update to latest version

2. **Use Different Device:**
   - Try on mobile device (iOS Safari or Chrome)
   - Try on different computer

3. **Use Different Network:**
   - Try from home instead of work
   - Try mobile hotspot
   - Try different WiFi network

4. **Manual Input:**
   - Type your messages normally
   - Voice features are optional enhancements
   - All functionality works without voice

---

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Network Error | Check internet connection, try different network |
| Mic Denied | Allow microphone in browser settings |
| No Speech | Speak louder, check microphone |
| Not Available | Update browser or switch to Chrome/Edge |
| TTS Silent | Check volume, unmute tab |
| Stops Immediately | Check network stability, try again |
| HTTPS Error | Use localhost for dev, HTTPS for production |

---

## Additional Resources

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Chrome Speech Recognition](https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api/)
- [Browser Compatibility](https://caniuse.com/speech-recognition)