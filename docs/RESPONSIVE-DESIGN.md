# PlaySync Responsive Design System

## Overview

The PlaySync application uses **1366x768** as the **base resolution** and scales up gracefully for larger screens (1440px, 1920px+).

## Breakpoints

| Breakpoint | Min Width | Target Resolution | Description                     |
| ---------- | --------- | ----------------- | ------------------------------- |
| Base       | -         | 1366x768          | Default laptop screens          |
| `laptop:`  | 1280px    | 1366x768+         | Small laptops (with scrollbars) |
| `desktop:` | 1440px    | 1440x900+         | Medium desktop monitors         |
| `xl:`      | 1920px    | 1920x1080+        | Large desktop monitors          |

## CSS Variables

The following CSS variables automatically adjust based on screen size:

```css
/* Base (1366x768) */
--sidebar-width-expanded: 220px;
--sidebar-width-collapsed: 70px;
--header-height: 60px;

/* 1440px+ */
--sidebar-width-expanded: 250px;
--sidebar-width-collapsed: 75px;
--header-height: 64px;

/* 1920px+ */
--sidebar-width-expanded: 280px;
--sidebar-width-collapsed: 80px;
--header-height: 68px;
```

## Usage Guidelines

### 1. Using Tailwind Responsive Classes

Use the breakpoint prefixes to apply styles at different screen sizes:

```tsx
// Padding increases on larger screens
<div className="px-3 laptop:px-5 desktop:px-6">
  Content
</div>

// Font size scales up
<h1 className="text-xl laptop:text-2xl desktop:text-3xl">
  Title
</h1>

// Gap between elements
<div className="grid gap-3 laptop:gap-4 desktop:gap-5">
  {/* Items */}
</div>
```

### 2. Using Responsive Utility Classes

Import the responsive utilities CSS and use predefined classes:

```tsx
// Responsive font sizes
<p className="text-responsive-base">Scales from 13px → 14px → 15px</p>
<p className="text-responsive-lg">Scales from 14px → 16px → 17px</p>

// Responsive spacing
<div className="spacing-responsive-md">Scales padding 12px → 16px → 20px</div>

// Responsive gaps
<div className="gap-responsive-lg">Scales gap 16px → 20px → 24px</div>

// Responsive cards
<div className="card-responsive">Scales padding & border-radius</div>

// Responsive buttons
<button className="btn-responsive">Scales padding, font-size & radius</button>

// Responsive icons
<Icon className="icon-responsive-md" />
```

### 3. Using CSS Variables Directly

```tsx
// Sidebar width
<div style={{ width: 'var(--sidebar-width-expanded)' }}>

// Header height
<header style={{ height: 'var(--header-height)' }}>
```

## Best Practices

### ✅ DO

1. **Design for 1366x768 first**, then scale up
2. Use `laptop:` prefix for adjustments at 1280px+
3. Use `desktop:` prefix for adjustments at 1440px+
4. Use `xl:` prefix for adjustments at 1920px+
5. Use responsive utility classes for consistent spacing
6. Test on actual 1366x768 screens

### ❌ DON'T

1. Use fixed pixel values for layout dimensions
2. Design only for large screens and squeeze down
3. Use hardcoded sidebar/header dimensions (use CSS variables)
4. Forget to test on low-height screens (768px)
5. Use arbitrary Tailwind values like `w-[220px]` (use CSS variables)

## Component Examples

### Sidebar

```tsx
// Uses CSS variables automatically
<div className={cn(
  isSidebarCollapsed
    ? 'w-[var(--sidebar-width-collapsed)]'
    : 'w-[var(--sidebar-width-expanded)]'
)}>
```

### Header

```tsx
// Uses CSS variable for height
<header style={{ height: 'var(--header-height)' }}>
```

### Dashboard Container

```tsx
// Automatically adjusts padding via .dashboard-container class
<main className="dashboard-container">{children}</main>
```

## Media Queries

### Width-based

```css
/* 1366px and below */
@media (max-width: 1366px) {
  /* Compact optimizations */
}

/* 1440px and above */
@media (min-width: 1440px) {
  /* Medium screens */
}

/* 1920px and above */
@media (min-width: 1920px) {
  /* Large screens */
}
```

### Height-based

```css
/* Low height screens */
@media (max-height: 768px) {
  /* Reduce vertical spacing */
}

/* Specific for 1366x768 */
@media (min-width: 1024px) and (max-height: 800px) {
  /* Optimize for laptop height */
}
```

## Testing

### Chrome DevTools

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these presets:
   - **1366x768** (Base)
   - **1440x900** (Desktop)
   - **1920x1080** (Full HD)

### Real Device Testing

Always test on actual hardware:

- 1366x768 laptops
- 1440x900 monitors
- 1920x1080 monitors
- 4K displays (3840x2160)

## Migration Guide

### From Fixed to Responsive

**Before:**

```tsx
<div className="px-6 py-4 text-base">
```

**After:**

```tsx
<div className="px-3 laptop:px-5 desktop:px-6 py-2 laptop:py-3 desktop:py-4 text-sm laptop:text-base desktop:text-lg">
```

### From Hardcoded to CSS Variables

**Before:**

```tsx
<div className="w-[220px]">
```

**After:**

```tsx
<div className="w-[var(--sidebar-width-expanded)]">
```

## Files

- `apps/web/src/app/globals.css` - Main responsive CSS and breakpoints
- `apps/web/src/styles/responsive-utilities.css` - Utility classes
- `apps/web/src/components/layout/sidebar.tsx` - Responsive sidebar
- `apps/web/src/components/layout/header.tsx` - Responsive header
- `apps/web/src/app/dashboard/client-layout.tsx` - Dashboard layout

## Support

For questions or issues, check:

1. This documentation
2. Existing component implementations
3. Tailwind CSS documentation
4. CSS custom properties documentation
