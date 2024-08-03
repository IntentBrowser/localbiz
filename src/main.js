import { createApp } from "vue";
import PrimeVue from "primevue/config";
import Material from "@primevue/themes/aura";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import QtyInput from "./components/QtyInput.vue";
import Home from "./components/Home.vue";

const routes = [{ path: "/", component: Home }];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

createApp(App)
    .use(router)
    .use(PrimeVue, {
        theme: {
            preset: Material,
            options: {
                darkModeSelector: ".bap-dark",
            },
        },
    })
    .mount("#app");
