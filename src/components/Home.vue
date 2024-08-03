<script>
import bap from "../../node_modules/@humbhionline/bap/dist/bap.es.js";
import * as Lockr from "lockr";
import Flow from "./Flow.vue";
export default {
    data() {
        return {
            bap: bap,
            network: bap.network(),
            location: undefined,
            n: {},
            showSettings: false,
            darkmode: Lockr.get("darkmode") || false,
            autoCloseSettings: true,
        };
    },
    mounted() {
        let self = this;
        this.setDarkMode();
        self.bap.loadLocation(false).then((l) => {
            self.location = l;
        });
        this.loadNetworkMeta();
    },
    computed: {
        network_set() {
            return this.n.name && this.n.domain && this.n.search_provider;
        },
        ok() {
            return this.network_set && this.location;
        },
    },
    methods: {
        onDarkModeSelect: function (ev) {
            this.setDarkMode();
        },
        setDarkMode() {
            Lockr.set("darkmode", this.darkmode);
            if (this.darkmode) {
                document.querySelector("html").classList.add("bap-dark");
            } else {
                document.querySelector("html").classList.remove("bap-dark");
            }
        },
        loadNetworkMeta() {
            let self = this;
            if (self.network.isSet()) {
                self.n = self.network.get();
                self.autoCloseSettings = false;
            } else {
                self.showSettings = !this.network_set;
            }
        },
        checkNetworkSettings() {
            if (this.showSettings && this.network_set && this.autoCloseSettings) {
                this.showSettings = false;
                this.autoCloseSettings = false;
            }
        },
        onNetworkChange(ev) {
            this.n.name = ev;
            this.n.domain = undefined;
            this.n.search_provider = undefined;
            this.checkNetworkSettings();
        },
        onDomainChange(ev) {
            this.n.domain = ev;
            this.checkNetworkSettings();
        },
        onSearchProviderChange(ev) {
            this.n.search_provider = ev;
            this.checkNetworkSettings();
        },
        settings(ev) {
            this.showSettings = !this.showSettings;
        },
    },
};
</script>
<template>
    <div>
        <div>
            <div class="absolute top-1 right-1">
                <Button icon="fas fa-bars text-xl" value="settings" @click="settings($event)" />
            </div>
            <Drawer v-model:visible="showSettings" position="right">
                <template #header>
                    <div class="flex items-center gap-2 w-fit">
                        <Avatar image="/images/logo.jpeg" />
                        <span class="font-bold">Settings</span>
                    </div>
                    <ToggleButton v-model="darkmode" onLabel="Bright" offLabel="Dark" onIcon="fa-sun fa-regular"
                        offIcon="fa-regular fa-moon" @update:model-value="onDarkModeSelect($event)">
                    </ToggleButton>
                </template>
                <div>
                    <Networks :autoCloseSettings="autoCloseSettings" :network="network"
                        @onNetworkChange="onNetworkChange($event)" @onDomainChange="onDomainChange($event)"
                        @onSearchProviderChange="onSearchProviderChange($event)" />
                </div>
            </Drawer>
            <Flow v-if="ok" id="flow" :location="location" :domain="n.domain" :search_provider="n.search_provider" />
            <div class="flex justify-center mt-40 font-extrabold text-xl text-red-600" v-else>
                <div v-if="!network_set">
                    Please set your network.
                </div>
                <div v-else>
                    Please give permission to access location.
                </div>

            </div>
        </div>
    </div>
</template>
