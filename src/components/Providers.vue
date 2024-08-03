<script>
export default {
    props: ["carts"],
    emits: ["onCheckOutCart"],
    data() {
        return {};
    },
    mounted() {},
    methods: {
        onCheckOutCart(ev, cart) {
            this.$emit("onCheckOutCart", cart);
        },
        canShowCart(cart) {
            return (
                cart &&
                cart.select &&
                cart.select.request &&
                cart.select.request.message &&
                cart.select.request.message.order
            );
        },
        cartTotal(cart) {
            let totalAmount = 0;
            let currency = undefined;
            cart.select.request.message.order.items.forEach((item) => {
                totalAmount +=
                    1.0 * item.quantity.selected.count * item.price.value;
                currency ||= item.price.currency;
            });
            return `${totalAmount} ${currency}`;
        },
    },
};
</script>
<template>
    <div class="card w-full">
        <div class="w-full" v-for="(cart, index) in carts">
            <div
                v-if="canShowCart(cart)"
                class="w-full border-b-2 border-b-black"
            >
                <div class="p-2 text-sm font-semibold bg-slate-400 w-full">
                    Subscriber : {{ cart.select.request.context.bpp_id }}
                </div>
                <div class="mt-1 px-2 flex font-bold w-full">
                    <div class="w-3/4 pt-2">
                        {{
                            cart.select.request.message.order.provider
                                .descriptor.name
                        }}/{{
                            cart.select.request.message.order.provider
                                .locations[0].descriptor.name
                        }}
                    </div>
                    <div class="w-1/4">
                        <Button
                            @click="onCheckOutCart($event, cart)"
                            class="w-full h-full font-extrabold"
                            >Book</Button
                        >
                    </div>
                </div>
                <div
                    class="p-2 mt-1 w-full"
                    v-for="(item, i) in cart.select.request.message.order.items"
                >
                    <div class="flex">
                        <div class="w-2/3 mt-1">
                            <div class="font-bold w-full">
                                {{ item.descriptor.long_desc }}
                            </div>
                            <div class="w-full" v-if="item.category_ids">
                                <Badge
                                    class="text-xs m-1 px-2"
                                    v-for="(cid, ci) in item.category_ids"
                                >
                                    {{ cid }}
                                </Badge>
                            </div>
                            <div class="w-full">
                                <Chip
                                    class="text-xs my-1"
                                    v-for="(fid, fi) in item.fulfillment_ids"
                                >
                                    {{ fid }}
                                </Chip>
                            </div>
                            <div class="w-full">
                                <Badge
                                    class="bg-blue-500 text-xs m-1 px-2"
                                    v-for="(pid, pi) in item.payment_ids"
                                >
                                    {{ pid }}
                                </Badge>
                            </div>
                        </div>
                        <div class="w-1/3 mt-1">
                            <!-- image content-->
                            <div class="w-full flex justify-end">
                                <img
                                    style="height: 5rem"
                                    v-bind:src="item.descriptor.images[0].url"
                                />
                            </div>
                        </div>
                    </div>
                    <div class="w-full flex">
                        <div class="w-full text-xs flex justify-end">
                            {{ item.quantity.selected.count }} X &nbsp;

                            <span
                                class="font-bold line-through"
                                v-if="
                                    item.price.listed_value > item.price.value
                                "
                            >
                                {{ item.price.listed_value }}
                            </span>
                            &nbsp; {{ item.price.value }}
                            {{ item.price.currency }}&nbsp;
                        </div>
                    </div>
                </div>
                <div class="p-2 mt-1 w-full">
                    <div class="w-full flex">
                        <div class="w-2/3 text-xs font-semibold">TOTAL</div>
                        <div
                            class="w-1/3 justify-end flex text-xs font-semibold"
                        >
                            {{ cartTotal(cart) }}&nbsp;
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
