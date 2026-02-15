# Solo Leveling Theme: Gap Analysis

## Overview
This document compares the provided HTML reference implementation against the current React/Next.js codebase to identify missing Solo Leveling theme elements.

---

## 1. Missing CSS Animations

### ❌ Scan-line Animation (Sweeping Effect)
**HTML Reference:**
```css
@keyframes scan {
  0% { top: 0%; }
  100% { top: 100%; }
}
.scan-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #a60df2, transparent);
  animation: scan 3s linear infinite;
  pointer-events: none;
  z-index: 50;
  box-shadow: 0 0 10px #a60df2;
}
```

**Current Status:** ❌ Not implemented
- Current `scanlines` utility is static background pattern
- No animated sweeping line effect

---

### ❌ Breathing Animations (Avatar Pulses)
**HTML Reference:**
```css
@keyframes breathing-purple {
  0%, 100% { box-shadow: 0 0 20px rgba(166, 13, 242, 0.6); }
  50% { box-shadow: 0 0 40px rgba(166, 13, 242, 0.9); }
}
```

**Current Status:** ⚠️ Partially implemented
- `.breathing-purple` class referenced in leaderboard page
- No actual `@keyframes` definition in globals.css
- HTML shows breathing-blue and breathing-gold variants (missing)

---

### ❌ Radar Pulse Animation
**HTML Reference:**
```css
@keyframes radar-pulse {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}
```

**Current Status:** ❌ Not implemented
- Proximity widget lacks animated radar sweep

---

## 2. Missing Tailwind Utilities

### ❌ `clip-path-slant`
**HTML Reference:**
```css
.clip-path-slant {
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%);
}
```

**Current Status:** ✅ Partial - we have `clip-corner` and `clip-corner-sm` but not the exact slant variant

---

### ❌ `text-glow` Utility
**HTML Reference:**
```css
.text-glow {
  text-shadow: 0 0 8px currentColor, 0 0 16px currentColor;
}
```

**Current Status:** ⚠️ Partial
- We have `.hunter-glow-text` with purple tint
- Missing generic `text-glow` that uses currentColor

---

### ❌ `.terminal-scroll` Custom Scrollbar
**HTML Reference:**
```css
.terminal-scroll::-webkit-scrollbar {
  width: 8px;
}
.terminal-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}
.terminal-scroll::-webkit-scrollbar-thumb {
  background: rgba(166, 13, 242, 0.6);
  border-radius: 4px;
}
.terminal-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(166, 13, 242, 0.9);
}
```

**Current Status:** ❌ Not implemented

---

## 3. Missing UI Components

### ❌ Proximity Radar Widget
**HTML Reference Structure:**
```html
<div class="radar-container">
  <div class="radar-ring"></div>
  <div class="radar-center"></div>
  <div class="proximity-line"></div>
  <!-- vertical connecting line to stats below -->
</div>
```

**Current Status:** ❌ Not implemented
- Current proximity card uses standard Card component
- No radar visual/animation

---

### ❌ Stats Mini-Dashboard with Animated Progress
**HTML Reference:**
```html
<div class="stat-row">
  <span>Win Rate</span>
  <div class="progress-bar">
    <div class="progress-fill" style="width: 87%"></div>
  </div>
  <span class="stat-value">87%</span>
</div>
```

**Current Status:** ⚠️ Partial
- Leaderboard "My Hunter Stats" has basic progress bar
- Missing multi-stat dashboard with labels + animated fills

---

### ❌ System Alert Messages (Terminal Style)
**HTML Reference:**
```html
<div class="system-alert">
  <span class="alert-icon">⚠</span>
  <span class="alert-text">PROXIMITY BREACH DETECTED</span>
  <span class="alert-timestamp">12:45:32</span>
</div>
```

**Current Status:** ❌ Not implemented

---

## 4. Typography & Fonts

### ❌ Space Grotesk & JetBrains Mono
**HTML Reference:**
```css
font-family: 'Space Grotesk', sans-serif; /* body text */
font-family: 'JetBrains Mono', monospace; /* terminal/code */
```

**Current Status:** ⚠️ Partial
- Orbitron imported and used for headings ✅
- Rajdhani used in watch page
- Space Grotesk & JetBrains Mono NOT imported

---

## 5. Leaderboard: React vs. HTML Reference

### Current React Implementation (app/leaderboard/page.tsx)
```tsx
// Uses shadcn components
<Card className="bg-[#07070a]/60">
  <CardHeader>
    <CardTitle>Proximity Alert</CardTitle>
  </CardHeader>
  <CardContent>
    {aroundMe.map(entry => (
      <div className="flex items-center p-3 border rounded-lg">
        <Avatar>...</Avatar>
      </div>
    ))}
  </CardContent>
</Card>
```

**Key Differences from HTML Reference:**
1. ❌ No scan-line animation overlay
2. ❌ Podium avatars lack breathing effects (class referenced but undefined)
3. ❌ Table lacks terminal-scroll custom scrollbar
4. ❌ No radar widget visual in proximity card
5. ⚠️ Uses React components (Card/Avatar/Badge) instead of raw divs
6. ✅ Has Orbitron headings
7. ✅ Has basic podium structure (simplified from reference)

---

## 6. Watch Page Current Status

### Elements Present ✅
- Orbitron font for headings
- Scanlines overlay (static)
- Basic HUD borders
- Purple/cyan color scheme
- Grid dot background pattern

### Elements Missing ❌
1. Terminal-scroll styling on content areas
2. Breathing animations on avatars
3. Scan-line sweeping effect
4. Proximity radar widget (if applicable)
5. Stats mini-dashboard
6. System alert messages
7. Advanced clip-path styling

---

## 7. Recommended Additions to globals.css

```css
/* 1. Define breathing animations */
@keyframes breathing-purple {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(166, 13, 242, 0.6), 0 0 40px rgba(166, 13, 242, 0.3); 
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 40px rgba(166, 13, 242, 0.9), 0 0 60px rgba(166, 13, 242, 0.5);
    transform: scale(1.05);
  }
}

@keyframes breathing-blue {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.6), 0 0 40px rgba(0, 229, 255, 0.3); 
  }
  50% { 
    box-shadow: 0 0 40px rgba(0, 229, 255, 0.9), 0 0 60px rgba(0, 229, 255, 0.5);
  }
}

@keyframes breathing-gold {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3); 
  }
  50% { 
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.9), 0 0 60px rgba(251, 191, 36, 0.5);
  }
}

@keyframes scan {
  0% { top: 0%; opacity: 0.8; }
  50% { opacity: 1; }
  100% { top: 100%; opacity: 0.8; }
}

/* 2. Utility classes */
.breathing-purple {
  animation: breathing-purple 3s ease-in-out infinite;
}

.breathing-blue {
  animation: breathing-blue 3s ease-in-out infinite;
}

.breathing-gold {
  animation: breathing-gold 3s ease-in-out infinite;
}

.scan-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #a60df2, transparent);
  animation: scan 3s linear infinite;
  pointer-events: none;
  z-index: 50;
  box-shadow: 0 0 10px #a60df2;
}

.text-glow {
  text-shadow: 0 0 8px currentColor, 0 0 16px currentColor;
}

.clip-path-slant {
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%);
}

.terminal-scroll::-webkit-scrollbar {
  width: 8px;
}

.terminal-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.terminal-scroll::-webkit-scrollbar-thumb {
  background: rgba(166, 13, 242, 0.6);
  border-radius: 4px;
  border: 1px solid rgba(166, 13, 242, 0.3);
}

.terminal-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(166, 13, 242, 0.9);
}
```

---

## Summary

### Priority 1 - Critical Missing Elements:
- ❌ Breathing animations (@keyframes definitions)
- ❌ Scan-line sweeping animation
- ❌ Terminal-scroll custom scrollbar
- ❌ Space Grotesk & JetBrains Mono fonts

### Priority 2 - Enhanced UX/Visual:
- ❌ Radar widget visual
- ❌ Stats dashboard with animated progress
- ❌ System alert notifications
- ❌ clip-path-slant utility

### Priority 3 - Polish:
- ⚠️ Convert leaderboard to match HTML structure more closely
- ⚠️ Add breathing effects to all podium avatars
- ⚠️ Enhance terminal styling across all pages

---

**Next Steps:**
1. Add missing @keyframes and utilities to globals.css
2. Apply full Solo Leveling theme to watch page
3. Integrate Space Grotesk/JetBrains Mono fonts
4. Build radar widget component for proximity alerts
