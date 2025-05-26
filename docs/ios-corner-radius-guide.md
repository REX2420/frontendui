# iOS Corner Radius System for VibCart

This guide explains how to use the iOS-style corner radius system implemented in VibCart for consistent, modern UI design.

## Overview

We've implemented a comprehensive corner radius system based on iOS design guidelines to ensure consistent and modern styling across all VibCart components.

## Available Corner Radius Values

| Use Case | Corner Radius | Tailwind Class | CSS Value |
|----------|---------------|----------------|-----------|
| Buttons (default) | `rounded-ios-button` | 10px |
| Cards / Modals / Sheets | `rounded-ios-card` | 16px |
| Cards / Modals / Sheets (large) | `rounded-ios-card-lg` | 20px |
| App Icons | `rounded-ios-icon` | 20px |
| Alert Views / Popups | `rounded-ios-alert` | 13px |
| Alert Views / Popups (large) | `rounded-ios-alert-lg` | 20px |
| Containers (inputs, etc.) | `rounded-ios-container` | 8px |
| Containers (large) | `rounded-ios-container-lg` | 16px |
| Tab Bars (floating) | `rounded-ios-tab` | 32px |

## Usage Examples

### Basic Usage with Tailwind Classes

```tsx
// Button
<button className="rounded-ios-button bg-primary text-white px-4 py-2">
  Click me
</button>

// Card
<div className="rounded-ios-card bg-white shadow-lg p-6">
  <h2>Card Title</h2>
  <p>Card content...</p>
</div>

// Input
<input className="rounded-ios-container border border-gray-300 px-3 py-2" />

// Alert/Modal
<div className="rounded-ios-alert bg-white shadow-xl p-6">
  <h3>Alert Title</h3>
  <p>Alert message...</p>
</div>
```

### Using the Utility Functions

```tsx
import { getIOSRadius, getComponentRadius } from '@/lib/ios-radius';

// Get specific radius class
const buttonClass = getIOSRadius('BUTTON'); // 'rounded-ios-button'

// Get radius for component type
const cardClass = getComponentRadius('card'); // 'rounded-ios-card'
```

## Updated Components

The following UI components have been updated to use the iOS corner radius system:

### ✅ Updated Components

- **Button** (`components/ui/button.tsx`) - Uses `rounded-ios-button` (10px)
- **Card** (`components/ui/card.tsx`) - Uses `rounded-ios-card` (16px)
- **Dialog** (`components/ui/dialog.tsx`) - Uses `rounded-ios-alert` (13px)
- **Input** (`components/ui/input.tsx`) - Uses `rounded-ios-container` (8px)
- **Textarea** (`components/ui/textarea.tsx`) - Uses `rounded-ios-container` (8px)

### 🔄 Components to Consider

- **Avatar** - Could use `rounded-ios-icon` for app icon style
- **Tabs** - Could use `rounded-ios-tab` for floating tab bar style
- **Sheet** - Already uses appropriate styling for side panels

## Best Practices

### 1. Choose the Right Radius

- **Buttons**: Always use `rounded-ios-button` for consistency
- **Cards**: Use `rounded-ios-card` for standard cards, `rounded-ios-card-lg` for prominent cards
- **Inputs**: Use `rounded-ios-container` for form elements
- **Alerts**: Use `rounded-ios-alert` for standard alerts, `rounded-ios-alert-lg` for important alerts

### 2. Consistency is Key

- Stick to the predefined values rather than creating custom border radius
- Use the utility functions when building dynamic components
- Maintain the same radius within component groups

### 3. Responsive Considerations

```tsx
// Example: Different radius for different screen sizes
<div className="rounded-ios-container sm:rounded-ios-card">
  Content that adapts its corner radius
</div>
```

## Migration Guide

If you have existing components using other border radius classes, here's how to migrate:

### Old → New Mapping

```tsx
// Old classes → New iOS classes
rounded-none     → rounded-ios-button (for buttons)
rounded-sm       → rounded-ios-container
rounded-md       → rounded-ios-container or rounded-ios-card
rounded-lg       → rounded-ios-card
rounded-xl       → rounded-ios-card-lg
rounded-2xl      → rounded-ios-tab
```

### Example Migration

```tsx
// Before
<button className="rounded-md bg-primary text-white px-4 py-2">
  Button
</button>

// After
<button className="rounded-ios-button bg-primary text-white px-4 py-2">
  Button
</button>
```

## Custom Components

When creating new components, use the appropriate iOS corner radius:

```tsx
// Product Card Component
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-ios-card bg-white shadow-lg overflow-hidden">
      <img src={product.image} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-gray-600">{product.price}</p>
        <button className="rounded-ios-button bg-primary text-white px-4 py-2 mt-2">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Classes not applying**: Make sure you've rebuilt your Tailwind CSS after updating the config
2. **Inconsistent styling**: Check that you're using the correct iOS radius class for the component type
3. **Custom overrides**: Avoid using arbitrary values like `rounded-[15px]` - stick to the predefined system

### Debugging

```bash
# Rebuild Tailwind CSS
npm run build

# Check if classes are generated
npx tailwindcss -i ./app/globals.css -o ./dist/output.css --watch
```

## Future Enhancements

Consider these enhancements for the future:

1. **Dark mode variants**: Adjust corner radius for dark mode if needed
2. **Animation support**: Smooth transitions between different radius values
3. **Component-specific variants**: More granular control for specific use cases

---

For questions or suggestions about the iOS corner radius system, please refer to the `lib/ios-radius.ts` utility file or consult the design team. 