<script>
export default {
    props: ["network", "autoCloseSettings"],
    emits: ["onNetworkChange", "onDomainChange", "onSearchProviderChange"],
    data() {
        return {
            n: {
                name: undefined,
                domain: undefined,
                domains: [],
                search_providers: [],
                search_provider: undefined,
            },
        };
    },

    mounted() {
        let network_ids = this.network.list();
        if (!this.network.isSet()) {
            if (network_ids.length == 1) {
                this.network.choose(network_ids[0]);
            }
        }

        if (this.network.isSet()) {
            this.n = this.network.get();
            this.onNetworkChange(null);
        }

    },
    methods: {
        onNetworkChange: function (value) {
            let self = this;
            if (value != null) { // From mounted no need to unset
                self.n.domain = undefined;
                self.n.domains = undefined;
                self.n.search_provider = undefined;
                self.n.search_providers = undefined;
            }

            if (self.n.name) {
                if (value != null) {
                    self.network.choose(self.n.name);
                }
                self.$emit("onNetworkChange", self.n.name);
                Promise.all([self.network.search_provider().list(), self.network.domains()]).then((results) => {
                    self.n.search_providers = results[0];
                    self.n.domains = results[1];
                    if (self.n.search_providers.length == 1) {
                        self.n.search_provider = self.n.search_providers[0];
                    }
                    if (self.n.domains.length == 1) {
                        self.n.domain = self.n.domains[0];
                    }
                    if (!self.n.domain) {
                        return self.network.domain().then((remembered_domain) => {
                            self.n.domain = remembered_domain;
                            return self.n.domain;
                        });
                    } else {
                        return new Promise((resolve, reject) => {
                            return resolve(self.n.domain);
                        });
                    }
                }).then(() => {
                    return self.onDomainChange(null).then(() => {
                        return self.onSearchProviderChange(null).then(() => {
                            self.$forceUpdate();
                        })
                    })
                });
            }
        },
        onDomainChange: function (ev) {
            let self = this;
            if (this.n.domain) {
                return this.network.domain(this.n.domain).then((found) => {
                    self.$emit("onDomainChange", found);
                });
            } else {
                return new Promise((resolve, reject) => {
                    resolve(undefined);
                });
            }
        },
        onSearchProviderChange: function (ev) {
            let self = this;
            if (this.n.search_provider) {
                let searchProviderRegistry = this.network.search_provider();
                return searchProviderRegistry
                    .choose(this.n.search_provider)
                    .then((subscriber) => {
                        self.$emit("onSearchProviderChange", subscriber);
                    });
            } else {
                return new Promise((resolve, reject) => {
                    resolve(undefined);
                });
            }
        },
    },
};
</script>
<template>
    <div class="flex-col card flex w-full justify-center">
        <div class="mt-10 relative">
            <Select id="network" class="w-full" v-model="n.name" :options="network.list()" checkmark
                :highlightOnSelect="false" @update:model-value="onNetworkChange($event)" />
            <label for="network" class="absolute ml-1 -mt-6 left-0 text-sm">Network
            </label>
        </div>

        <div class="mt-10 relative" v-if="n.name && n.domains">
            <Select id="domain" class="w-full" v-model="n.domain" @update:model-value="onDomainChange($event)" checkmark
                :highlightOnSelect="false" :options="n.domains" optionLabel="description">
            </Select>
            <label for="domain" class="absolute ml-1 -mt-6 left-0 text-sm">Domain
            </label>
        </div>

        <div class="mt-10 relative" v-if="n.name && n.search_providers">
            <Select id="search engine" class="w-full" v-model="n.search_provider"
                @update:model-value="onSearchProviderChange($event)" checkmark :highlightOnSelect="false"
                :options="n.search_providers" optionLabel="subscriber_id">
            </Select>
            <label for="search_engine" class="absolute ml-1 -mt-6 left-0 text-sm">Search Engine
            </label>
        </div>
        <!--
        <ToggleButton v-model="checked" onLabel="Light" offLabel="Dark" @update:model-value="onStateChange($event)">
        </ToggleButton>
        -->
    </div>
</template>
