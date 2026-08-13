import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		proxy: {
			"/api": {
				// 5001, not 5000: macOS AirPlay Receiver occupies port 5000
				target: "http://localhost:5001",
			},
		},
	},
});