<script>
export default {
    props: ["modelValue", "item", "disabled"],
    emits: ["update:modelValue", "cartItemAdded", "cartItemQtyChanged", "cartItemRemoved"],
    computed: {
        value: {
            get() {
                return this.modelValue;
            },
            set(value) {
                if (value <= 0) {
                    if (this.modelValue > 0) {
                        this.$emit("cartItemRemoved", this.item);
                    }
                } else {
                    if (this.modelValue <= 0) {
                        this.$emit("cartItemAdded", this.item);
                    }
                }
                this.$emit("update:modelValue", Math.max(value, 0));
                this.$emit("cartItemQtyChanged", Math.max(value, 0))
            },
        },
    },
};
</script>
<template>
    <div
        class="flex justify-center w-full text-sm  border-emerald-500 border-2 bg-emerald-500  rounded-l-lg rounded-r-lg">
        <button :disabled="disabled" class="w-1/4 fas fa-minus text-white focus:outline-none m-1"
            @click="() => --value"></button>
        <input :disabled="disabled" class="w-1/2 text-center rounded-none  focus:outline-none " v-model="value"></input>
        <button :disabled="disabled" class="w-1/4 fas fa-plus  text-white focus:outline-none m-1"
            @click="() => ++value"></button>
    </div>
</template>
