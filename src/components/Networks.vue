<script>
export default {
    props: ["network"],
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
        if (this.network.isSet()) {
            this.n = this.network.get();
            this.$forceUpdate();
            this.$emit("onNetworkChange", this.n.name);
        }
    },
    methods: {
        onNetworkChange: function (value) {
            let self = this;
            self.n.domain = undefined;
            self.n.domains = undefined;
            self.n.search_provider = undefined;
            self.n.search_providers = undefined;

            if (self.n.name) {
                self.network.choose(self.n.name);
                self.$emit("onNetworkChange", self.n.name);
                let searchProviderRegistry = self.network.search_provider();

                searchProviderRegistry
                    .list()
                    .then((providers) => {
                        self.n.search_providers = providers;
                        if (searchProviderRegistry.isSet()) {
                            self.n.search_provider =
                                searchProviderRegistry.get();
                            self.$emit(
                                "onSearchProviderChange",
                                self.n.search_provider
                            );
                        }
                    })
                    .then(() => {
                        self.network.domains().then((domains) => {
                            self.network
                                .domain()
                                .then((remembered_domain) => {
                                    self.n.domain = remembered_domain;
                                    self.n.domains = domains;
                                })
                                .finally(() => {
                                    if (self.n.domain) {
                                        self.$emit(
                                            "onDomainChange",
                                            self.n.domain
                                        );
                                    }
                                });
                        });
                    });
            }
        },
        onDomainChange: function (ev) {
            let self = this;
            if (this.n.domain) {
                this.network.domain(this.n.domain).then((found) => {
                    self.$emit("onDomainChange", found);
                });
            }
        },
        onSearchProviderChange: function (ev) {
            let self = this;
            if (this.n.search_provider) {
                let searchProviderRegistry = this.network.search_provider();
                searchProviderRegistry
                    .choose(this.n.search_provider)
                    .then((subscriber) => {
                        self.$emit("onSearchProviderChange", subscriber);
                    });
            }
        },

    },
};
</script>
<template>
    <div class="flex-col card flex w-full justify-center">
        <div class="mt-10 relative ">
            <Select id="network" class="w-full" v-model="n.name" :options="network.list()" checkmark
                :highlightOnSelect="false" @update:model-value="onNetworkChange($event)" />
            <label for="network" class="absolute ml-1  -mt-6 left-0 text-sm">Network </label>
        </div>

        <div class="mt-10 relative" v-if="n.name && n.domains">
            <Select id="domain" class="w-full" v-model="n.domain" @update:model-value="onDomainChange($event)" checkmark
                :highlightOnSelect="false" :options="n.domains" optionLabel="description">
            </Select>
            <label for="domain" class="absolute ml-1  -mt-6 left-0 text-sm">Domain </label>
        </div>

        <div class="mt-10 relative" v-if="n.name && n.search_providers">
            <Select id="search engine" class="w-full" v-model="n.search_provider"
                @update:model-value="onSearchProviderChange($event)" checkmark :highlightOnSelect="false"
                :options="n.search_providers" optionLabel="subscriber_id">
            </Select>
            <label for="search_engine" class="absolute ml-1  -mt-6 left-0 text-sm">Search Engine </label>

        </div>
        <!--
        <ToggleButton v-model="checked" onLabel="Light" offLabel="Dark" @update:model-value="onStateChange($event)">
        </ToggleButton>
        -->
    </div>
</template>
