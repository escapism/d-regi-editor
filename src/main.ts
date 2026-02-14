import { createApp } from "vue";
import "./style.scss";
import App from "./App.vue";
import { createGtm } from "@gtm-support/vue-gtm";

const app = createApp(App);

if (import.meta.env.PROD && navigator.onLine) {
  app.use(
    createGtm({
      id: import.meta.env.VITE_GTM_ID,
      defer: false, 
      compatibility: false,
      enabled: navigator.onLine,
      debug: import.meta.env.DEV,
      loadScript: true,
      trackOnNextTick: false,
    }),
  );
}

app.mount("#app");
