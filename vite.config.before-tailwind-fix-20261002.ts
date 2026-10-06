import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Alza il limite di warning per i chunk
    chunkSizeWarningLimit: 1000, 
    
    rollupOptions: {
      output: {
        // Suddividi le librerie esterne in chunk separati
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
