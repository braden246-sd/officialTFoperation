// The current shift. Home updates this, and other screens read it.
export const shift = {
  start: new Date(),
  end: null as Date | null,
};

function time(d: Date) {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
}

// Builds text like "Shift: Nov 25, 3:10 PM - 3:45 PM"
export function shiftLabel() {
  const day = shift.start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const end = shift.end ? time(shift.end) : 'now';
  return `Shift: ${day}, ${time(shift.start)} - ${end}`;
}