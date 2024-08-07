<script>
import bap from "../../node_modules/@humbhionline/bap/dist/bap.es.js";
import Providers from "./Providers.vue";

export default {
    props: ["id", "location", "domain", "search_provider"],
    data() {
        let params = new URL(window.location).searchParams;
        return {
            network: bap.network(),
            transactions: undefined,
            carts: undefined,
            providers: [],
            catalog: {},
            search_transaction: undefined,
            viewCarts: false,
            searchState: {
                provider_id: params.get("provider_id"),
                complete: true,
            },
        };
    },
    created() {
        this.initializeCart(false);
        if (this.searchState.provider_id) {
            this.search(null);
        }
    },
    methods: {
        firstOpenCart: function () {
            let self = this;
            let firstOpenCart = self.carts.find((cart) => {
                return (
                    cart.select.request &&
                    cart.select.request.message &&
                    cart.select.request.message.order
                );
            });
            return firstOpenCart;
        },
        openCartsDrawer: function () {
            this.viewCarts = !this.showCarts; // Toggle
        },
        initializeCart(reset = false) {
            this.viewCarts = false;
            this.transactions = this.network.transactions();
            this.carts = this.transactions.carts();

            let transaction_ids = [];
            this.carts.forEach((cart) => {
                cart.search.request.message.intent.descriptor ||= {};
                cart.search.request.message.intent.location ||= {
                    gps: `${this.location.latitude},${this.location.longitude}`,
                };
                if (
                    !cart.select.request ||
                    !cart.select.request.message ||
                    !cart.select.request.message.order
                ) {
                    transaction_ids.push(
                        cart.search.request.context.transaction_id,
                    );
                }
            });
            transaction_ids.forEach((txnId) => {
                this.transactions.close_cart(txnId);
            });

            let cart = this.transactions.new_cart();
            cart.search.request.context.ttl = "PT6S";
            cart.search.request.message.intent.descriptor ||= {};
            cart.search.request.message.intent.location ||= {
                gps: `${this.location.latitude},${this.location.longitude}`,
            };
            if (this.searchState.provider_id) {
                cart.search.request.message.intent.provider = {
                    id: this.searchState.provider_id,
                };
            }
            this.search_transaction = this.transactions.transaction(
                cart.search.request.context.transaction_id,
            );
            if (reset) {
                this.catalog = {};
                this.providers = [];
            }
        },
        isMobile: function () {
            return this.isMobileBrowser();
        },
        isMobileBrowser: function () {
            var hasTouchScreen = false;
            if ("maxTouchPoints" in navigator) {
                hasTouchScreen = navigator.maxTouchPoints > 0;
            } else if ("msMaxTouchPoints" in navigator) {
                hasTouchScreen = navigator.msMaxTouchPoints > 0;
            } else {
                var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
                if (mQ && mQ.media === "(pointer:coarse)") {
                    hasTouchScreen = !!mQ.matches;
                } else if ("orientation" in window) {
                    hasTouchScreen = true; // deprecated, but good fallback
                } else {
                    // Only as a last resort, fall back to user agent sniffing
                    var UA = navigator.userAgent;
                    hasTouchScreen =
                        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
                        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA) ||
                        /\b(Mobile)\b/i.test(UA);
                }
            }

            return hasTouchScreen;
        },
        onCheckOutCart: function (cart) {
            let self = this;

            if (
                !cart.select.request ||
                !cart.select.request.message ||
                !cart.select.request.message.order
            ) {
                //This is the search cart
                //let context = cart.search.request.context;
                //this.transactions.close_cart(context.transaction_id);
                return;
            }
            let context = cart.select.request.context;
            let current_transaction = self.transactions.transaction(
                context.transaction_id,
            );

            let order = cart.select.request.message.order;

            if (!context.bpp_url) {
                cart.confirm.request ||= {};
                cart.confirm.request.context ||= JSON.parse(
                    JSON.stringify(context),
                ); // Clone
                delete cart.confirm.request.context.message_id;
                cart.confirm.request.message ||= {};
                cart.confirm.request.message.order = order;
                current_transaction.confirm().then(() => {
                    let msg = "\n";
                    order.items.forEach((i) => {
                        msg += `* ${i.descriptor.long_desc}(${i.quantity.selected.count})\n`;
                    });
                    let waurl = "whatsapp://send";
                    if (!this.isMobile()) {
                        waurl = "https://web.whatsapp.com/send";
                    }
                    msg += `\n https://www.google.com/maps/place/${this.location.latitude},${this.location.longitude}`;

                    waurl +=
                        "?phone=" +
                        order.provider.fulfillments[0].contact.phone +
                        "&text=" +
                        encodeURIComponent(
                            "I would like to order with you " + msg,
                        );

                    console.log(waurl);
                    window.open(waurl, "_blank");
                    //this.transactions.close_cart(context.transaction_id);
                    if (this.carts.length == 0 || !this.firstOpenCart()) {
                        this.initializeCart(true);
                    }
                    // self.$forceUpdate();
                });
            } else {
                //Continuw with select, init, confirm.. TODO
            }
        },
        findCart: function (provider, location) {
            let cart = this.carts.find((cart) => {
                return (
                    cart.select.request &&
                    cart.select.request.context.bpp_id ==
                    provider.context.bpp_id &&
                    cart.select.request.message &&
                    cart.select.request.message.order &&
                    provider.id ==
                    cart.select.request.message.order.provider.id &&
                    location.id ==
                    cart.select.request.message.order.provider.locations[0]
                        .id
                );
            });
            return cart;
        },
        cart: function (provider, location) {
            let cart =
                this.findCart(provider, location) ||
                this.transactions.new_cart();
            cart.search.request.context ||= {};
            cart.search.response ||= {};
            cart.search.response.context ||= {
                ...provider.context,
                ...cart.search.request.context,
            };

            cart.select.request ||= {};
            cart.select.request.context ||= cart.search.response.context;
            cart.select.request.message ||= {};
            cart.select.request.message.order ||= {};
            cart.select.request.message.order.provider ||= JSON.parse(
                JSON.stringify(provider),
            );
            let final_provider = cart.select.request.message.order.provider;
            let final_location = JSON.parse(JSON.stringify(location));
            delete final_location.items;

            final_provider.locations = [];
            final_provider.locations.push(final_location);

            let final_fulfillments = final_provider.fulfillments;

            delete final_provider.categories;
            delete final_provider.items;
            delete final_provider.fulfillments;
            delete final_provider.payments;
            final_provider.fulfillments ||= [];
            Object.keys(final_fulfillments).forEach((k) => {
                let f = final_fulfillments[k];
                if (f.type == "HOME-DELIVERY") {
                    f.stops = [{
                        location: final_provider.locations[0]
                    }, {
                        location: {
                            gps: `${this.location.latitude},${this.location.longitude}`,
                        },
                    }];
                }
                final_provider.fulfillments.push(f);
            });

            cart.select.request.message.order.provider.locations =
                final_provider.locations;

            // Mo Message.
            return cart;
        },
        addItemToCart: function (item, provider, location) {
            let self = this;
            let cart = self.cart(provider, location);
            let order = cart.select.request.message.order;

            order.items ||= [];
            order.items.push(item);

            self.network.persist();
        },
        changeItemQuantityInCart: function (item, provider, location) {
            this.network.persist();
        },
        removeItemFromCart: function (item, provider, location) {
            let self = this;
            let cart = self.findCart(provider, location);
            let order = cart.select.request.message.order;

            let index = order.items.findIndex((i) => {
                return item.id == i.id;
            });
            order.items.splice(index, 1);
            if (order.items.length == 0) {
                self.transactions.close_cart(
                    cart.select.request.context.transaction_id,
                );
            } else {
                self.network.persist();
            }
        },
        search: function (ev) {
            ev && ev.preventDefault();
            let self = this;
            this.catalog = {};
            this.providers = [];
            this.searchState.complete = false;

            self.search_transaction.search().then((response) => {
                if (response.message.ack.status == "ACK") {
                    self.search_transaction.read_events(
                        self.search_transaction.payload("search").request
                            .context.message_id,
                        self.on_search,
                    );
                }
            });
        },
        index_catalog_meta(context, provider) {
            let self = this;
            self.catalog[context.bpp_id] ||= {};
            let meta = self.catalog[context.bpp_id];
            meta.context = context;
            meta.providers ||= {};
            if (!meta.providers[provider.id]) {
                meta.providers[provider.id] = JSON.parse(
                    JSON.stringify(provider),
                );
                self.providers.push(provider);
            } else {
                return;
            }

            let p = meta.providers[provider.id];
            p.fulfillments = {};
            p.payments = {};
            p.categories = {};
            p.locations = {};
            p.items = {};
            provider.fulfillments.forEach((f) => {
                p.fulfillments[f.id] ||= f;
            });
            provider.payments.forEach((pmt) => {
                p.payments[pmt.id] ||= pmt;
            });
            provider.categories.forEach((c) => {
                p.categories[c.id] ||= c;
            });
            provider.locations.forEach((l) => {
                p.locations[l.id] ||= l;
            });
            provider.items.forEach((i) => {
                p.items[i.id] ||= i;
                i.location_ids.forEach((location_id) => {
                    p.locations[location_id].items ||= {};
                    p.locations[location_id].items[i.id] = JSON.parse(
                        JSON.stringify(i),
                    );
                    let openCart = this.findCart(
                        provider,
                        p.locations[location_id],
                    );
                    if (openCart) {
                        let cart_quantity = this.get_selected_quantity(
                            openCart,
                            i,
                        );
                        if (cart_quantity) {
                            p.locations[location_id].items[i.id].quantity =
                                cart_quantity;
                        }
                    }
                    p.locations[location_id].items[i.id].quantity.selected ||= {
                        count: 0,
                    };
                });
            });
        },
        get_selected_quantity(cart, item) {
            let request = cart.select.request;
            let message = request ? request.message : undefined;
            let order = message ? message.order : undefined;
            let selected_item = order.items.find((i) => i.id == item.id);
            return selected_item ? selected_item.quantity : undefined;
        },
        on_search: function (response) {
            if (!response) {
                this.searchState.complete = true;
                return; // Done.
            }
            let self = this;
            let catalog = response.message.catalog;
            let bpp_fulfillments = catalog.fulfillments || [];
            let bpp_payments = catalog.payments || [];
            catalog.providers.forEach((provider) => {
                provider.fulfillments ||= [];
                provider.fulfillments.push(...bpp_fulfillments);
                provider.payments ||= [];
                provider.payments.push(...bpp_payments);
                provider.context = response.context;
                self.index_catalog_meta(response.context, provider);
            });
        },
    },
};
</script>
<template>
    <div class="mx-5 mt-20">
        <div class="flex justify-center" v-if="search_transaction">
            <form class="flex justify-center sm:w-full md:w-1/2">
                <InputText type="text" v-model="search_transaction.payload('search').request.message
                    .intent.descriptor.long_desc
                    " placeholder=" What are you looking for?" class="w-full" :id="id + '_text'"
                    v-if="!domain.meta || !domain.meta.used_for_transport"></InputText>
                <Button :id="id + '_btn'" class="ml-2 px-6" @click="search($event)" type="submit" label="Search"
                    :icon="!searchState.complete ? 'fa-solid fa-circle-notch fa-spin-pulse' : 'fa-solid fa-search'">
                </Button>
            </form>
        </div>
        <div class=" justify-start mt-10">
            <div class="w-full " v-for="(bpp, bpp_id) in catalog">
                <div class="w-full" v-for="(provider, provider_id) in bpp.providers">
                    <div class="w-full flex-wrap flex" v-for="(location, location_id) in provider.locations">
                        <div class="m-1 w-1/3" v-for="(item, item_id) in location.items">
                            <!-- Items at a location index method on_search fixes this-->
                            <div v-bind:key="item.id" class="border-2 rounded-lg p-1 border-emerald-500 w-full">
                                <div class="flex">
                                    <div class="w-3/4">
                                        <!-- Text Content -->
                                        <div class="font-bold m-1 w-full truncate">
                                            {{ item.descriptor.long_desc }}
                                        </div>
                                        <div class="text-sm font-medium m-1 w-full">
                                            <a class="text-blue-900 hover:underline" :href="'?provider_id=' +
                                                provider.id
                                                ">
                                                {{
                                                    provider.descriptor.name
                                                }}/{{
                                                    location.descriptor.name
                                                }}
                                            </a>
                                        </div>
                                        <div class="w-full flex overflow-x-scroll">
                                            <Badge severity="info" class="whitespace-nowrap text-xs m-1 px-1" v-for="(
                                                    cid, ci
                                                ) in item.category_ids">
                                                {{
                                                    provider.categories[cid]
                                                        .descriptor.long_desc
                                                }}
                                            </Badge>
                                        </div>
                                        <div class="w-full">
                                            <Badge severity="secondary" class="text-xs my-1" v-for="(
                                                    fid, fi
                                                ) in item.fulfillment_ids">
                                                {{ provider.fulfillments[fid].type }}
                                            </Badge>
                                        </div>
                                        <div class="w-full">
                                            <Badge severity="info" class="text-xs m-1 px-2" v-for="(
                                                    pid, pi
                                                ) in item.payment_ids">
                                                {{ pid }}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div class="w-20 mt-1">
                                        <img class="w-full h-full" v-bind:src="item.descriptor.images[0].url
                                            " />
                                    </div>
                                </div>
                                <div class="flex">
                                    <div class="w-full text-xs flex justify-end">
                                        <div class="w-1/3 m-1">
                                            <QtyInput v-bind:key="'count_' + item.id" v-bind:item="item" v-model="item.quantity.selected.count
                                                " @cart-item-qty-changed="
                                                    changeItemQuantityInCart(
                                                        $event,
                                                        provider,
                                                        location,
                                                    )
                                                    " @cart-item-added="
                                                        addItemToCart(
                                                            $event,
                                                            provider,
                                                            location,
                                                        )
                                                        " @cart-item-removed="
                                                                        removeItemFromCart(
                                                                            $event,
                                                                            provider,
                                                                            location,
                                                                        )
                                                                        " />
                                        </div>
                                        <div class="w-1/3 flex justify-end mx-6">
                                            <span class="font-bold line-through" v-if="
                                                item.price.listed_value >
                                                item.price.value
                                            ">
                                                {{ item.price.listed_value }}
                                            </span>
                                            {{ item.price.value }}
                                            {{ item.price.currency }}&nbsp;
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="absolute bottom-5 right-5" v-if="firstOpenCart()">
        <div class="my-2">
            <Button @click="openCartsDrawer" icon="fa-solid fa-arrow-right" label="Proceed" iconPos="right"></Button>
        </div>
    </div>
    <div>
        <Drawer v-model:visible="viewCarts" position="bottom" class="!h-4/5 md:!w-1/3 m-10">
            <template #header>
                <div class="flex items-center gap-2">
                    <Avatar image="/images/logo.jpeg" />
                    <span class="font-bold">Open Shopping List</span>
                </div>
            </template>
            <div>
                <Providers :carts="carts" @onCheckOutCart="onCheckOutCart($event)" />
            </div>
        </Drawer>
    </div>
</template>
