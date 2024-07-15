<script>
import bap from "../../node_modules/@humbhionline/bap/dist/bap.es.js";
export default {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    data() {
        return {
            network: bap.network(),
        };
    },
    computed: {
        value: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit("update:modelValue", value);
            },
        },
    },
    mounted() {
        if (!this.modelValue.network.name) {
            if (this.network.isSet()) {
                this.$emit("update:modelValue", {
                    network: this.network.get(),
                }); //For defaulting from local storage.
            }
        }
    },

    methods: {
        network_select: function (ev) {
            ev && ev.preventDefault();
            let self = this;

            if (ev && ev.target.value) {
                this.value.network = self.network.choose(ev.target.value).get();
                self.network.domains().then((domains) => {
                    self.$forceUpdate();
                });
            }
        },
        domain_select: function (ev) {
            ev && ev.preventDefault();
            let self = this;

            if (self.value.network.domain) {
                self.network.domain(self.value.network.domain); // Save in local storage
            }
        },
    },
};
</script>
<template>
    <select v-model="value.network.name" @change="network_select($event)">
        <option :value="n" v-for="(n, i) in network.list()">{{ n }}</option>
    </select>
    <select
        v-model="value.network.domain"
        v-if="value.network && value.network.domains"
        @change="domain_select($event)"
    >
        <option :value="n" v-for="(n, i) in value.network.domains">
            {{ n.description }}
        </option>
    </select>
</template>
