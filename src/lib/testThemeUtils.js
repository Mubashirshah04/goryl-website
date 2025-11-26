import { getThemeTextColor, getThemeSecondaryTextColor, getThemeBackgroundColor, getThemeBorderColor, getThemeGradient, getThemeLinkColor, getThemeIconBackground } from './themeUtils';
// Test function to verify theme utilities work correctly
export const testThemeUtils = () => {
    console.log('Testing theme utilities...');
    // Test dark theme
    console.log('Dark theme:');
    console.log('  Text color:', getThemeTextColor('dark'));
    console.log('  Secondary text color:', getThemeSecondaryTextColor('dark'));
    console.log('  Background color:', getThemeBackgroundColor('dark'));
    console.log('  Border color:', getThemeBorderColor('dark'));
    console.log('  Gradient:', getThemeGradient('dark'));
    console.log('  Link color:', getThemeLinkColor('dark'));
    console.log('  Icon background:', getThemeIconBackground('dark'));
    // Test light theme
    console.log('Light theme:');
    console.log('  Text color:', getThemeTextColor('light'));
    console.log('  Secondary text color:', getThemeSecondaryTextColor('light'));
    console.log('  Background color:', getThemeBackgroundColor('light'));
    console.log('  Border color:', getThemeBorderColor('light'));
    console.log('  Gradient:', getThemeGradient('light'));
    console.log('  Link color:', getThemeLinkColor('light'));
    console.log('  Icon background:', getThemeIconBackground('light'));
    // Test undefined theme
    console.log('Undefined theme:');
    console.log('  Text color:', getThemeTextColor(undefined));
    console.log('  Secondary text color:', getThemeSecondaryTextColor(undefined));
    console.log('✅ Theme utilities test completed successfully');
};
// Run the test
// testThemeUtils();
