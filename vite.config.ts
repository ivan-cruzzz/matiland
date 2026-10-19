import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["coin.svg"],
      manifest: {
        name: "Матилэнд — весёлая математика",
        short_name: "Матилэнд",
        description:
          "Игровое обучение математике для детей 1–4 класса: задачи, монеты, герой и магазин.",
        lang: "ru",
        theme_color: "#FDF8F2",
        background_color: "#FDF8F2",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/coin.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
    }),
  ],
});
