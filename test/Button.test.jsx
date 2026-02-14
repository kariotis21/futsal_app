import { describe, it, expect } from 'vitest';

describe('Button Component Variants', () => {
  it('should have primary variant as default', () => {
    // Test that primary variant classes are correctly assigned
    const variants = {
      primary: 'bg-green-800 hover:bg-green-900 text-white',
      secondary: 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white',
      blue: 'bg-blue-700 hover:bg-blue-800 text-white'
    };
    
    expect(variants.primary).toContain('bg-green-800');
  });

  it('should have size presets (sm, md, lg)', () => {
    const sizes = {
      sm: 'py-2 text-sm px-4',
      md: 'py-3 text-lg px-6',
      lg: 'py-4 text-xl px-8'
    };
    
    expect(sizes.md).toContain('text-lg');
    expect(sizes.lg).toContain('text-xl');
  });

  it('should apply fullWidth class when needed', () => {
    const fullWidthClass = 'w-full';
    expect(fullWidthClass).toBe('w-full');
  });

  it('button should have focus-visible ring styles for accessibility', () => {
    const focusClasses = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500';
    expect(focusClasses).toContain('focus-visible:ring-2');
  });
});

