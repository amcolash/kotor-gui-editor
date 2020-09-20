import { platform } from 'os';

export const isDevelopment = process.env.NODE_ENV !== 'production';
export const os = platform().replace('win32', 'win').replace('darwin', 'mac');

export const lightBackground = '#eee';
export const darkBackground = '#ccc';

export const lightColor = '#333';
export const darkColor = '#555';

export const lightSelection = '#2de00d';
export const darkSelection = '#f2abff';
export const previewDarkSelection = '#0cbb00';

export const darkBackgroundInput = '#ddd';
export const darkOutlineInput = '#888';

export const iconSize = 15;
