// Helper functions for theme-aware colors as per project specifications
export const getThemeTextColor = (theme) => {
    return theme === 'dark' ? 'text-white' : 'text-gray-900';
};
export const getThemeSecondaryTextColor = (theme) => {
    return theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
};
export const getThemeBackgroundColor = (theme) => {
    return theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
};
export const getThemeBorderColor = (theme) => {
    return theme === 'dark' ? 'border-gray-800' : 'border-gray-200';
};
export const getThemeGradient = (theme) => {
    return theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/5 to-gray-900'
        : 'bg-gradient-to-br from-gray-50 to-gray-100';
};
export const getThemeLinkColor = (theme) => {
    return theme === 'dark'
        ? 'text-gray-400 hover:text-white'
        : 'text-gray-600 hover:text-purple-600';
};
export const getThemeIconBackground = (theme) => {
    return theme === 'dark'
        ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50'
        : 'bg-white border border-gray-200';
};
