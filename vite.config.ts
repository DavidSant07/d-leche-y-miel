import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Custom plugin to handle the new requested color scheme across all files
const colorSchemePlugin = () => {
  return {
    name: 'replace-color-scheme',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('/src/') && (id.endsWith('.tsx') || id.endsWith('.ts') || id.endsWith('.css'))) {
        return code
          // Buttons and explicit backgrounds
          .replace(/bg-\[#E4835D\] text-white/gi, 'bg-[#E6C2F3] text-[#301438]')
          .replace(/bg-\[#E4835D\]/gi, 'bg-[#E6C2F3]')
          .replace(/hover:bg-\[#E4835D\]/gi, 'hover:bg-[#E6C2F3]')
          .replace(/border-\[#E4835D\]/gi, 'border-[#E6C2F3]')
          
          // Hover states for primary buttons -> dark purple
          .replace(/hover:bg-\[#c9704e\]/gi, 'hover:bg-[#C161E4]')
          
          // Glows and box shadows specifically
          .replace(/rgba\(228,\s*131,\s*93/g, 'rgba(230, 194, 243')
          .replace(/228,131,93/g, '230,194,243')
          
          // Text and other occurrences of primary orange -> strong purple
          .replace(/#E4835D/gi, '#C161E4')
          .replace(/#c9704e/gi, '#C161E4')
          
          // Rest of theme mappings
          .replace(/#3E2723/gi, '#301438') // Dark headings -> Very Dark Purple
          .replace(/#6D524A/gi, '#623B6B') // Soft brown -> Medium Dark Purple
          .replace(/#FDFBF7/gi, '#FFFFFF') // Cream bg -> Pure White
          .replace(/#FFF5EE/gi, '#FAF0FD') // Light gradient -> Very Light Purple
          .replace(/#FFE4D6/gi, '#E3B7F3') // Lighter accent -> Soft Light Purple
          .replace(/#8FCDFE/gi, '#E3B7F3'); // Any residual secondary maps to soft purple
      }
      return code;
    }
  }
}


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    colorSchemePlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
