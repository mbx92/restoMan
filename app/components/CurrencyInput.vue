<template>
  <input
    ref="inputRef"
    v-bind="$attrs"
    type="text"
    inputmode="numeric"
    :placeholder="placeholder"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue: number
    placeholder?: string
  }>(),
  { placeholder: '0' }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const fmt = new Intl.NumberFormat('id-ID')

function format(val: number): string {
  return val ? fmt.format(val) : ''
}

function setVal(v: string) {
  if (inputRef.value) inputRef.value.value = v
}

onMounted(() => setVal(format(props.modelValue)))

function onFocus() {
  // reformat with separators (same as while typing)
  setVal(format(props.modelValue))
  // select all for easy replacement
  nextTick(() => inputRef.value?.select())
}

function onBlur() {
  setVal(format(props.modelValue))
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const prev = el.value
  const cursorPos = el.selectionStart ?? prev.length

  // strip non-digits
  const digits = prev.replace(/\D/g, '')
  const num = digits === '' ? 0 : parseInt(digits, 10)
  const formatted = format(num)

  // calculate new cursor position:
  // count how many digits are before the cursor in the old string
  const digitsBefore = prev.slice(0, cursorPos).replace(/\D/g, '').length
  // find the position in the formatted string where that many digits have passed
  let newCursor = 0
  let counted = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) counted++
    if (counted === digitsBefore) { newCursor = i + 1; break }
  }
  if (digitsBefore === 0) newCursor = 0

  el.value = formatted
  el.setSelectionRange(newCursor, newCursor)

  emit('update:modelValue', num)
}

watch(
  () => props.modelValue,
  (val) => {
    // only sync from outside when the input is not focused
    if (document.activeElement !== inputRef.value) setVal(format(val))
  }
)
</script>
