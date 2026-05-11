import { defineConfig } from 'vite';

// GitHub Pages sirve el repo en https://carlosortega77.github.io/Memoria/
// El base path debe coincidir o los assets fallarán al cargar.
export default defineConfig({
  base: '/Memoria/',
});
