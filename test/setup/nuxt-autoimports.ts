/**
 * Setup for Vitest: предоставляет глобальные символы, которые в Nuxt
 * доступны через auto-import, но в Vitest их нужно регистрировать явно.
 *
 * Stores используют: defineStore (pinia), ref/computed/reactive (vue).
 * Composables могут использовать watch, watchEffect, onMounted, etc.
 */

import { defineStore } from 'pinia'
import {
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  nextTick,
} from 'vue'

declare global {
   
  var defineStore: typeof import('pinia').defineStore
   
  var ref: typeof import('vue').ref
   
  var reactive: typeof import('vue').reactive
   
  var computed: typeof import('vue').computed
   
  var watch: typeof import('vue').watch
   
  var watchEffect: typeof import('vue').watchEffect
   
  var onMounted: typeof import('vue').onMounted
   
  var onUnmounted: typeof import('vue').onUnmounted
   
  var nextTick: typeof import('vue').nextTick
}

globalThis.defineStore = defineStore
globalThis.ref = ref
globalThis.reactive = reactive
globalThis.computed = computed
globalThis.watch = watch
globalThis.watchEffect = watchEffect
globalThis.onMounted = onMounted
globalThis.onUnmounted = onUnmounted
globalThis.nextTick = nextTick

export {}
