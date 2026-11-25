import assert from 'node:assert/strict';
import { businessDateForShift, businessDateNow } from './business-date';

// Proof the business-date rule works:  npm run check:business-date
//
// This is my evidence for SC2 and POC-2. If I change the rule I run this first -
// a mistake here makes every total wrong without anything looking broken.
//
// The times are written in UTC because that's how they're stored. Edmonton is 7
// hours behind UTC in winter and 6 in summer, so the summer cases aren't just
// copies of the winter ones.

let passed = 0;

function check(label: string, actual: string, expected: string): void {
  assert.equal(actual, expected, label + ' -> got ' + actual + ', expected ' + expected);
  // Throws and stops the script if they don't match. No test framework needed.

  console.log('  ok  ' + label);
  passed += 1;
}


// ---- Winter, 7 hours behind UTC ----

// 5pm Monday 2 Nov local = midnight UTC on the 3rd.
check(
  'evening shift keeps its own date',
  businessDateForShift(new Date('2026-11-03T00:00:00Z')),
  '2026-11-02'
);

// 1:30am Tuesday local. Filed after midnight, but it's still Monday's night.
// This is the case the whole rule exists for.
check(
  'after midnight belongs to the night before',
  businessDateForShift(new Date('2026-11-03T08:30:00Z')),
  '2026-11-02'
);

// 5:59am local, one minute before my cutoff.
check(
  'one minute before 6am is still the previous night',
  businessDateForShift(new Date('2026-11-03T12:59:00Z')),
  '2026-11-02'
);

// 6:00am local, the cutoff itself.
check(
  '6am starts a new business date',
  businessDateForShift(new Date('2026-11-03T13:00:00Z')),
  '2026-11-03'
);


// ---- Rolling back over the edges ----

// 1:30am on 1 December has to roll into November.
check(
  'rolls back across a month boundary',
  businessDateForShift(new Date('2026-12-01T08:30:00Z')),
  '2026-11-30'
);

// 1:30am on New Year's Day has to roll into the previous year.
check(
  'rolls back across a year boundary',
  businessDateForShift(new Date('2027-01-01T08:30:00Z')),
  '2026-12-31'
);


// ---- Summer, 6 hours behind UTC ----
// These two catch daylight saving. If someone swaps my noon-UTC anchor in
// dayBefore() for midnight, the winter cases keep passing and these start
// failing.

// 5pm Wednesday 15 July local = 11pm UTC the same day.
check(
  'summer evening shift keeps its own date',
  businessDateForShift(new Date('2026-07-15T23:00:00Z')),
  '2026-07-15'
);

// 1:30am Thursday local in summer.
check(
  'summer after midnight belongs to the night before',
  businessDateForShift(new Date('2026-07-16T07:30:00Z')),
  '2026-07-15'
);


// ---- The "which night just finished" helper ----

check(
  'businessDateNow picks the night that just ended',
  businessDateNow(new Date('2026-11-03T13:00:00Z')),
  '2026-11-03'
);

console.log('');
console.log(passed + ' checks passed');
