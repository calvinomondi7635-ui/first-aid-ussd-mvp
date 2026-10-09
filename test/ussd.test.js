const test = require('node:test');
const assert = require('node:assert/strict');
const { handleUssd } = require('../server');

test('first screen lists the requested regions in order', () => {
  const result = handleUssd('');
  const labels = ['1. Head', '2. Chest', '3. Abdomen', '4. Lower abdomen to feet'];
  let previousIndex = -1;
  for (const label of labels) {
    const index = result.indexOf(label);
    assert.ok(index > previousIndex, `${label} should appear in order`);
    previousIndex = index;
  }
  assert.match(result, /5\. Emergency \/ severe symptoms/);
});

test('emergency option ends with urgent instructions', () => {
  assert.match(handleUssd('5'), /^END .*urgent help/i);
});

test('yes to a danger sign ends with urgent instructions', () => {
  assert.match(handleUssd('2*1*1'), /^END .*urgent help/i);
});

test('uncertain answer is routed to urgent instructions', () => {
  assert.match(handleUssd('1*1*3'), /^END .*urgent help/i);
});

test('no danger signs gives cautious referral, not a diagnosis', () => {
  const result = handleUssd('3*1*2');
  assert.match(result, /^END Contact a health worker or clinic/);
  assert.match(result, /cannot diagnose/);
});

test('zero exits from the main menu', () => {
  assert.equal(handleUssd('0'), 'END Session ended.');
});
