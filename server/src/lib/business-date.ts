// The business-date rule. One file owns it and everything else asks this file.
//
// The pub trades past midnight, so a report filed at 1:30am belongs to the
// night before. My rule: take the Edmonton time, knock six hours off, keep the
// date. That handles both cases at once - an evening shift stays on its own
// day, and the early hours roll back. This is SC2.

export const ZONE = 'America/Edmonton';
// Hard-coded on purpose. There's one pub, and the rule shouldn't change based
// on where the server happens to be running.

export const NIGHT_ENDS_AT_HOUR = 6;
// 6am. Anything before this belongs to the night before.


// Break an instant into its Edmonton date and hour.
function edmontonParts(instant: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    // I can't just use getHours(), because that uses whatever time zone the
    // server is set to. Asking for a specific zone is the only reliable way
    // without pulling in another library.
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    // h23 means hours run 00-23.
    //
    // I'm deliberately not using hour12: false. On some systems that gives "24"
    // for midnight instead of "00", which would sail past my 6am check and date
    // the report to the wrong night - the exact bug this rule exists to stop.
  }).formatToParts(instant);
  // formatToParts gives me a list of pieces instead of one finished string, so
  // I can pick out the bits I want.

  const pick = (type: string): string => {
    const found = parts.find((p) => p.type === type);
    if (!found) throw new Error('Missing date part: ' + type);
    return found.value;
  };
  // Small helper so I'm not writing .find() four times. It throws rather than
  // returning undefined, because a missing piece means something is badly wrong
  // and I'd rather know immediately.

  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
  };
}


// Step back one day from a YYYY-MM-DD string.
function dayBefore(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00Z');
  // Anchored at NOON UTC, not midnight. This looks fussy but it matters: on the
  // two days a year the clocks change, a midnight anchor can land on the wrong
  // side and move the date by a day. Noon is twelve hours from either edge.

  d.setUTCDate(d.getUTCDate() - 1);
  // setUTCDate handles the awkward cases for me - going back from the 1st of a
  // month, or the 1st of January, both land right.

  return d.toISOString().slice(0, 10);
  // toISOString gives "2026-11-02T12:00:00.000Z", so I keep the first 10 chars.
}


// Which night does this shift belong to? Pass the shift's start time, get
// "YYYY-MM-DD" back.
//
// Always from the SHIFT START - never the submission time, and never a date the
// app sent me, since the app is handed out to staff and anything it sends can be
// edited.
export function businessDateForShift(shiftStartedAt: Date): string {
  const { year, month, day, hour } = edmontonParts(shiftStartedAt);

  const localDate = year + '-' + month + '-' + day;
  // The plain Edmonton date, before I apply the rule.

  return Number(hour) >= NIGHT_ENDS_AT_HOUR ? localDate : dayBefore(localDate);
  // 6am or later: the night is its own date. Before 6am: it's still yesterday's.
}


// Which night has just finished, as of now? Used when I compile a summary
// without being told which date.
export function businessDateNow(now: Date = new Date()): string {
  return businessDateForShift(now);
  // Same function, so the two can't drift apart.
}


// The same rule in SQL. I need this because some queries filter thousands of
// rows by night, and pulling every shift into JavaScript to check them one at a
// time would be silly.
//
// Reading inside out: convert to Edmonton time, knock six hours off, drop the
// time and keep the date.
//
// IF I CHANGE THE RULE ABOVE, I HAVE TO CHANGE THIS TOO. If these two ever
// disagree, the dashboard and the nightly email report different numbers for the
// same evening, with no error to warn anyone. That's why both live in this file.
export const BUSINESS_DATE_SQL =
  `(((shifts.started_at AT TIME ZONE '${ZONE}') - interval '${NIGHT_ENDS_AT_HOUR} hours')::date)`;
// Built from the same two constants as the function, so changing either updates
// both at once.
//
// It says "shifts.started_at", so any query using it needs the shifts table
// joined in. Safe to drop straight into a query because it's my own fixed text -
// no user input goes near it.
