# Design System Guidelines

## 프로젝트 전체 디자인 시스템

이 문서는 문해력 테스트 웹 애플리케이션의 모든 페이지와 컴포넌트에 적용되는 디자인 지침입니다.

---

## Color System

### Light Mode
```css
:root {
  --background: oklch(0.9940 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(0.9940 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(0.9911 0 0);
  --popover-foreground: oklch(0 0 0);
  --primary: oklch(0.3394 0.1817 299.4789);          /* 보라색 */
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.3394 0.1817 299.4789);        /* 보라색 */
  --secondary-foreground: oklch(1.0000 0 0);
  --muted: oklch(0.9702 0 0);
  --muted-foreground: oklch(0.4386 0 0);
  --accent: oklch(0.9439 0.0319 309.9407);
  --accent-foreground: oklch(0.3394 0.1817 299.4789);
  --destructive: oklch(0.6290 0.1902 23.0704);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9300 0.0094 286.2156);
  --input: oklch(0.9401 0 0);
  --ring: oklch(0 0 0);
  --chart-1: oklch(0.7459 0.1483 156.4499);
  --chart-2: oklch(0.5393 0.2713 286.7462);
  --chart-3: oklch(0.7336 0.1758 50.5517);
  --chart-4: oklch(0.5828 0.1809 259.7276);
  --chart-5: oklch(0.5590 0 0);
  --sidebar: oklch(0.9777 0.0051 247.8763);
  --sidebar-foreground: oklch(0 0 0);
  --sidebar-primary: oklch(0 0 0);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.9401 0 0);
  --sidebar-accent-foreground: oklch(0 0 0);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0 0 0);
}
```

### Dark Mode
```css
.dark {
  --background: oklch(0.2223 0.0060 271.1393);
  --foreground: oklch(0.9551 0 0);
  --card: oklch(0.2568 0.0076 274.6528);
  --card-foreground: oklch(0.9551 0 0);
  --popover: oklch(0.2568 0.0076 274.6528);
  --popover-foreground: oklch(0.9551 0 0);
  --primary: oklch(0.6132 0.2294 291.7437);          /* 보라색 */
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.2940 0.0130 272.9312);
  --secondary-foreground: oklch(0.9551 0 0);
  --muted: oklch(0.2940 0.0130 272.9312);
  --muted-foreground: oklch(0.7058 0 0);
  --accent: oklch(0.2795 0.0368 260.0310);
  --accent-foreground: oklch(0.7857 0.1153 246.6596);
  --destructive: oklch(0.7106 0.1661 22.2162);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3289 0.0092 268.3843);
  --input: oklch(0.3289 0.0092 268.3843);
  --ring: oklch(0.6132 0.2294 291.7437);
  --chart-1: oklch(0.8003 0.1821 151.7110);
  --chart-2: oklch(0.6132 0.2294 291.7437);
  --chart-3: oklch(0.8077 0.1035 19.5706);
  --chart-4: oklch(0.6691 0.1569 260.1063);
  --chart-5: oklch(0.7058 0 0);
  --sidebar: oklch(0.2011 0.0039 286.0396);
  --sidebar-foreground: oklch(0.9551 0 0);
  --sidebar-primary: oklch(0.6132 0.2294 291.7437);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.2940 0.0130 272.9312);
  --sidebar-accent-foreground: oklch(0.6132 0.2294 291.7437);
  --sidebar-border: oklch(0.3289 0.0092 268.3843);
  --sidebar-ring: oklch(0.6132 0.2294 291.7437);
}
```

---

## Typography

### Font Families
```css
--font-sans: Plus Jakarta Sans, sans-serif;        /* Primary */
--font-serif: Lora, serif;                         /* Headings */
--font-mono: IBM Plex Mono, monospace;             /* Code */
```

### Letter Spacing
```css
--tracking-normal: -0.025em;
--tracking-tighter: calc(var(--tracking-normal) - 0.05em);
--tracking-tight: calc(var(--tracking-normal) - 0.025em);
--tracking-wide: calc(var(--tracking-normal) + 0.025em);
--tracking-wider: calc(var(--tracking-normal) + 0.05em);
--tracking-widest: calc(var(--tracking-normal) + 0.1em);
```

### Body Default
```css
body {
  letter-spacing: var(--tracking-normal);
}
```

---

## Border Radius

```css
--radius: 1.4rem;                                  /* Base radius */
--radius-sm: calc(var(--radius) - 4px);            /* 1.0rem */
--radius-md: calc(var(--radius) - 2px);            /* 1.2rem */
--radius-lg: var(--radius);                        /* 1.4rem */
--radius-xl: calc(var(--radius) + 4px);            /* 1.8rem */
```

---

## Shadows

### Shadow System
```css
--shadow-x: 0px;
--shadow-y: 2px;
--shadow-blur: 3px;
--shadow-spread: 0px;
--shadow-opacity: 0.16;
--shadow-color: hsl(0 0% 0%);

--shadow-2xs: 0px 2px 3px 0px hsl(0 0% 0% / 0.08);
--shadow-xs: 0px 2px 3px 0px hsl(0 0% 0% / 0.08);
--shadow-sm: 0px 2px 3px 0px hsl(0 0% 0% / 0.16), 0px 1px 2px -1px hsl(0 0% 0% / 0.16);
--shadow: 0px 2px 3px 0px hsl(0 0% 0% / 0.16), 0px 1px 2px -1px hsl(0 0% 0% / 0.16);
--shadow-md: 0px 2px 3px 0px hsl(0 0% 0% / 0.16), 0px 2px 4px -1px hsl(0 0% 0% / 0.16);
--shadow-lg: 0px 2px 3px 0px hsl(0 0% 0% / 0.16), 0px 4px 6px -1px hsl(0 0% 0% / 0.16);
--shadow-xl: 0px 2px 3px 0px hsl(0 0% 0% / 0.16), 0px 8px 10px -1px hsl(0 0% 0% / 0.16);
--shadow-2xl: 0px 2px 3px 0px hsl(0 0% 0% / 0.40);
```

---

## Spacing

```css
--spacing: 0.27rem;                                /* Base spacing unit */
```

---

## Component Guidelines

### Buttons
```tsx
// Primary Button
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm">
  Primary Button
</button>

// Secondary Button
<button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium shadow-sm">
  Secondary Button
</button>

// Outline Button
<button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground font-medium">
  Outline Button
</button>

// Destructive Button
<button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium shadow-sm">
  Delete
</button>
```

### Cards
```tsx
<div className="bg-card rounded-lg shadow-md border border-border p-6">
  <h3 className="text-lg font-semibold text-card-foreground mb-4">Card Title</h3>
  <p className="text-muted-foreground">Card content</p>
</div>
```

### Input Fields
```tsx
<input
  type="text"
  className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
  placeholder="Enter text..."
/>
```

### Select Dropdowns
```tsx
<select className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

### Modals
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
  <div className="bg-card rounded-lg shadow-xl p-6 max-w-md w-full border border-border">
    <h2 className="text-xl font-bold text-card-foreground mb-4">Modal Title</h2>
    <p className="text-muted-foreground mb-6">Modal content</p>
    <div className="flex justify-end gap-3">
      <button className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-foreground">
        Cancel
      </button>
      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Tables
```tsx
<div className="bg-card rounded-lg shadow overflow-hidden border border-border">
  <div className="overflow-x-auto">
    <table className="w-full divide-y divide-border">
      <thead className="bg-muted">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Header
          </th>
        </tr>
      </thead>
      <tbody className="bg-card divide-y divide-border">
        <tr className="hover:bg-muted/50 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
            Cell
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Badges
```tsx
// Primary Badge
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
  Badge
</span>

// Chart Color Badges
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-chart-1/20 text-chart-1">
  Success
</span>
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-chart-3/20 text-chart-3">
  Warning
</span>
<span className="px-3 py-1 rounded-full text-xs font-semibold bg-destructive/20 text-destructive">
  Error
</span>
```

---

## Layout Structure

### Page Container
```tsx
<div className="min-h-screen bg-background">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page content */}
  </div>
</div>
```

### Section Spacing
```tsx
<div className="space-y-6">
  <section>{/* Section 1 */}</section>
  <section>{/* Section 2 */}</section>
  <section>{/* Section 3 */}</section>
</div>
```

### Grid Layouts
```tsx
// 2-column grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Grid items */}
</div>

// 3-column grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>
```

---

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach
Always design mobile-first, then enhance for larger screens:

```tsx
// Mobile: stack vertically
// Desktop: side by side
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">{/* Content 1 */}</div>
  <div className="flex-1">{/* Content 2 */}</div>
</div>
```

---

## Accessibility

### Focus States
All interactive elements must have visible focus states:
```css
focus:outline-none focus:ring-2 focus:ring-primary
```

### ARIA Labels
Use proper ARIA labels for screen readers:
```tsx
<button aria-label="Close modal" onClick={onClose}>
  <CloseIcon />
</button>
```

### Color Contrast
Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text).

---

## Animation & Transitions

### Standard Transitions
```css
transition-colors    /* Color changes */
transition-opacity   /* Fade in/out */
transition-transform /* Movement/scale */
transition-all       /* Multiple properties */
```

### Durations
- Fast: `duration-150` (150ms)
- Normal: `duration-200` (200ms)
- Slow: `duration-300` (300ms)

### Hover Effects
```tsx
// Button hover
hover:bg-primary/90

// Scale on hover
hover:scale-105 transition-transform

// Shadow on hover
hover:shadow-lg transition-shadow
```

---

## Icons

### Icon Library
Use Lucide React for consistent iconography:
```tsx
import { Check, X, AlertCircle, Info } from 'lucide-react';

<Check className="w-5 h-5 text-chart-1" />
```

### Icon Sizes
- `w-4 h-4`: Small (16px)
- `w-5 h-5`: Medium (20px)
- `w-6 h-6`: Large (24px)
- `w-8 h-8`: Extra Large (32px)

---

## Best Practices

1. **Consistency**: Always use design tokens (CSS variables) instead of hardcoded values
2. **Accessibility**: Test with keyboard navigation and screen readers
3. **Responsiveness**: Test on mobile, tablet, and desktop
4. **Performance**: Optimize images and minimize animations
5. **Dark Mode**: Always test both light and dark modes
6. **Loading States**: Show appropriate loading indicators
7. **Error States**: Display clear error messages with recovery options
8. **Empty States**: Provide helpful guidance when no data exists

---

## Implementation Example

```tsx
// Complete component following design system
export default function ExampleCard() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Page Title</h1>
          <p className="text-muted-foreground mt-2">Page description</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-lg shadow-md border border-border p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Card Title</h2>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Input Label
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-input text-foreground"
                placeholder="Enter value..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-foreground">
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```
