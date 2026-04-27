import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWalletStore } from '@stores/wallet-store'

describe('wallet-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('должен инициализироваться с значениями по умолчанию', () => {
    const wallet = useWalletStore()
    expect(wallet.money).toBe(5000)
    expect(wallet.reserveFund).toBe(0)
    expect(wallet.totalEarned).toBe(0)
    expect(wallet.totalSpent).toBe(0)
  })

  it('должен правильно зарабатывать деньги', () => {
    const wallet = useWalletStore()
    const initialMoney = wallet.money
    wallet.earn(1000)
    expect(wallet.money).toBe(initialMoney + 1000)
    expect(wallet.totalEarned).toBe(1000)
  })

  it('должен правильно тратить деньги', () => {
    const wallet = useWalletStore()
    wallet.money = 10000
    const spent = wallet.spend(3000)
    expect(spent).toBe(3000)
    expect(wallet.money).toBe(7000)
    expect(wallet.totalSpent).toBe(3000)
  })

  it('не должен тратить больше чем есть', () => {
    const wallet = useWalletStore()
    wallet.money = 1000
    const spent = wallet.spend(5000)
    expect(spent).toBe(1000)
    expect(wallet.money).toBe(0)
  })

  it('canAfford должен правильно проверять', () => {
    const wallet = useWalletStore()
    wallet.money = 5000
    expect(wallet.canAfford(3000)).toBe(true)
    expect(wallet.canAfford(6000)).toBe(false)
  })

  it('должен переводить в резерв', () => {
    const wallet = useWalletStore()
    wallet.money = 10000
    wallet.transferToReserve(5000)
    expect(wallet.money).toBe(5000)
    expect(wallet.reserveFund).toBe(5000)
  })

  it('должен извлекать из резерва', () => {
    const wallet = useWalletStore()
    wallet.reserveFund = 5000
    wallet.money = 1000
    wallet.transferFromReserve(3000)
    expect(wallet.reserveFund).toBe(2000)
    expect(wallet.money).toBe(4000)
  })

  it('netWorth должен вычисляться правильно', () => {
    const wallet = useWalletStore()
    wallet.money = 10000
    wallet.reserveFund = 5000
    expect(wallet.netWorth).toBe(15000)
  })

  it('setMoney должен устанавливать корректную сумму', () => {
    const wallet = useWalletStore()
    wallet.setMoney(25000)
    expect(wallet.money).toBe(25000)
  })

  it('addMoney должен добавлять к существующему', () => {
    const wallet = useWalletStore()
    const initial = wallet.money
    wallet.addMoney(5000)
    expect(wallet.money).toBe(initial + 5000)
  })

  it('reset должен сбрасывать состояние', () => {
    const wallet = useWalletStore()
    wallet.money = 100000
    wallet.reserveFund = 50000
    wallet.reset()
    expect(wallet.money).toBe(5000)
    expect(wallet.reserveFund).toBe(0)
  })
})