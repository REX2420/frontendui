/**
 * iOS-style Corner Radius System for VibCart
 * 
 * This file provides utilities and constants for consistent iOS-style corner radius usage
 * across the VibCart application components.
 */

// iOS Corner Radius Constants (in pixels)
export const IOS_RADIUS = {
  BUTTON: '10px',        // Buttons (default)
  CARD: '16px',          // Cards / Modals / Sheets (16-20pt)
  CARD_LG: '20px',       // Cards / Modals / Sheets (larger variant)
  ICON: '20px',          // App Icons
  ALERT: '13px',         // Alert Views / Popups (13-20pt)
  ALERT_LG: '20px',      // Alert Views / Popups (larger variant)
  CONTAINER: '8px',      // Containers (8-16pt)
  CONTAINER_LG: '16px',  // Containers (larger variant)
  TAB: '32px',           // Tab Bars (floating styles)
} as const;

// Tailwind CSS class names for iOS corner radius
export const IOS_RADIUS_CLASSES = {
  BUTTON: 'rounded-ios-button',
  CARD: 'rounded-ios-card',
  CARD_LG: 'rounded-ios-card-lg',
  ICON: 'rounded-ios-icon',
  ALERT: 'rounded-ios-alert',
  ALERT_LG: 'rounded-ios-alert-lg',
  CONTAINER: 'rounded-ios-container',
  CONTAINER_LG: 'rounded-ios-container-lg',
  TAB: 'rounded-ios-tab',
} as const;

// Helper function to get the appropriate corner radius class based on component type
export function getIOSRadius(componentType: keyof typeof IOS_RADIUS_CLASSES): string {
  return IOS_RADIUS_CLASSES[componentType];
}

// Usage examples and component mapping
export const COMPONENT_RADIUS_MAPPING = {
  // Buttons
  'button': IOS_RADIUS_CLASSES.BUTTON,
  'submit-button': IOS_RADIUS_CLASSES.BUTTON,
  'action-button': IOS_RADIUS_CLASSES.BUTTON,
  
  // Cards and Modals
  'card': IOS_RADIUS_CLASSES.CARD,
  'modal': IOS_RADIUS_CLASSES.CARD,
  'sheet': IOS_RADIUS_CLASSES.CARD,
  'large-card': IOS_RADIUS_CLASSES.CARD_LG,
  
  // Alerts and Popups
  'alert': IOS_RADIUS_CLASSES.ALERT,
  'popup': IOS_RADIUS_CLASSES.ALERT,
  'dialog': IOS_RADIUS_CLASSES.ALERT,
  'large-alert': IOS_RADIUS_CLASSES.ALERT_LG,
  
  // Containers and Inputs
  'input': IOS_RADIUS_CLASSES.CONTAINER,
  'textarea': IOS_RADIUS_CLASSES.CONTAINER,
  'container': IOS_RADIUS_CLASSES.CONTAINER,
  'large-container': IOS_RADIUS_CLASSES.CONTAINER_LG,
  
  // Icons
  'app-icon': IOS_RADIUS_CLASSES.ICON,
  'avatar': IOS_RADIUS_CLASSES.ICON,
  
  // Tab Bars
  'tab-bar': IOS_RADIUS_CLASSES.TAB,
  'floating-tab': IOS_RADIUS_CLASSES.TAB,
} as const;

/**
 * Get the appropriate iOS corner radius class for a component
 * @param componentType - The type of component
 * @returns The corresponding Tailwind CSS class
 */
export function getComponentRadius(componentType: keyof typeof COMPONENT_RADIUS_MAPPING): string {
  return COMPONENT_RADIUS_MAPPING[componentType];
} 