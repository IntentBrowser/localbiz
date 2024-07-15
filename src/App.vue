<script>
import bap from "../node_modules/@humbhionline/bap/dist/bap.es.js";
import Networks from "./components/Networks.vue";
import Search from "./components/Search.vue";
import * as Lockr from "lockr";
export default {
    data() {
        return {
            network_meta: {
                network: {
                    name: undefined,
                    domain: undefined,
                },
            },
        };
    },
    components: {
        Networks,
        Search,
    },
};
</script>

<template>
    <Networks v-model="network_meta" />
    <Search v-model="network_meta" />
</template>
