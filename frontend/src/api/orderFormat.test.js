import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizePaymentStatus } from './orderFormat.js'

test('missing payment data does not imply a confirmed payment', () => {
  assert.equal(normalizePaymentStatus(undefined, undefined), 'Pending')
  assert.equal(normalizePaymentStatus(undefined, 'pending_payment'), 'Pending')
})

test('confirmed order state remains a backend confirmation', () => {
  assert.equal(normalizePaymentStatus(undefined, 'confirmed'), 'Confirmed')
  assert.equal(normalizePaymentStatus(undefined, 'shipped'), 'Confirmed')
})

test('explicit payment results take precedence', () => {
  assert.equal(normalizePaymentStatus('completed', 'pending_payment'), 'Confirmed')
  assert.equal(normalizePaymentStatus('failed', 'confirmed'), 'Failed')
})
