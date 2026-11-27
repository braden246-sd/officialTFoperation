-- Tommyfield Ops - the whole database, six tables.
--
--   npm run db:init
--
-- Order matters. A table that points at another with REFERENCES can only be
-- created after the one it points at, so: users, then shifts, then everything
-- that hangs off a shift.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('supervisor', 'manager', 'administrator')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- shifts has to be created before sales_reports, because sales_reports points
-- at it with REFERENCES shifts(id). Postgres checks that the table being
-- pointed at already exists, so with the other order this file stopped on an
-- error and none of the tables after it were made.
CREATE TABLE IF NOT EXISTS shifts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at   TIMESTAMPTZ
);

-- Only one running shift (ended_at empty) per user, enforced by the database itself
CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_one_open
  ON shifts(user_id) WHERE ended_at IS NULL;

CREATE TABLE IF NOT EXISTS sales_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id    UUID NOT NULL UNIQUE REFERENCES shifts(id),
  report_date DATE NOT NULL,
  food_sales  NUMERIC(12,2) NOT NULL CHECK (food_sales >= 0),
  drink_sales NUMERIC(12,2) NOT NULL CHECK (drink_sales >= 0),
  total_sales NUMERIC(12,2) NOT NULL CHECK (total_sales >= 0),
  source      TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('ocr', 'manual')),
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_reports(report_date);


-- Something that happened during a shift. A fight, a spill, a complaint.
CREATE TABLE IF NOT EXISTS incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  shift_id        UUID NOT NULL REFERENCES shifts(id),
  -- Which shift it happened on. REFERENCES makes the database check the shift
  -- actually exists, so I can't save an incident against a made-up one. This is
  -- the link that ties an incident to a night and to a person.

  title           TEXT NOT NULL DEFAULT 'Incident',
  -- Short name. The screen doesn't ask for one yet, so it falls back to this.

  description     TEXT NOT NULL,
  -- What happened. NOT NULL with no default means I'm requiring it.

  location        TEXT,
  -- Where in the pub. Optional.

  people_involved TEXT,
  -- Who was there. Also optional.

  severity        TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  -- How bad. CHECK blocks anything that isn't one of those three words, so the
  -- database refuses bad data even if I forget to check it in the route.

  created_by      UUID NOT NULL REFERENCES users(id),
  -- Who reported it.

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_shift ON incidents(shift_id);
-- Makes "find all incidents for this shift" fast once there are a lot of rows.


-- A broken fryer, a dead till.
CREATE TABLE IF NOT EXISTS appliance_issues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  shift_id    UUID NOT NULL REFERENCES shifts(id),

  appliance   TEXT NOT NULL,
  -- Which machine. Required - without it the record is useless.

  description TEXT NOT NULL DEFAULT '',
  -- Required, but defaults to empty, so the screen can leave it blank.

  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fixed')),
  -- New faults start as open.

  created_by  UUID NOT NULL REFERENCES users(id),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  resolved_at TIMESTAMPTZ
  -- When it was marked fixed. Stays empty while it's open.
);

CREATE INDEX IF NOT EXISTS idx_appliance_shift ON appliance_issues(shift_id);

CREATE INDEX IF NOT EXISTS idx_appliance_open  ON appliance_issues(status) WHERE status = 'open';
-- Only covers the open rows, because "what's still broken" is the only question
-- anyone asks. Smaller and faster than indexing everything.


-- One row per trading night.
CREATE TABLE IF NOT EXISTS nightly_summaries (
  business_date    DATE PRIMARY KEY,
  -- The night this row is about, and its ID at the same time.
  --
  -- Making it the primary key is the whole trick: two rows for the same night
  -- become impossible, no matter how many times the job runs. SC5 asks for
  -- exactly one row per night, so I'm letting the database guarantee it rather
  -- than trying to remember to check.
  --
  -- This is the BUSINESS date, not the calendar date. See lib/business-date.ts.

  food_sales       NUMERIC(12,2) NOT NULL DEFAULT 0,
  drink_sales      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_sales      NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- NUMERIC(12,2) is exact, unlike a normal decimal number, which drifts once
  -- you add a lot of them up. Default 0 so a quiet night still gets a row.

  incident_count   INTEGER NOT NULL DEFAULT 0,

  open_issue_count INTEGER NOT NULL DEFAULT 0,
  -- How many faults are still open right now.

  compiled_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- When I last built this row.

  emailed_at       TIMESTAMPTZ,
  -- When the email went out. Empty if it didn't.

  mail_note        TEXT
  -- Why it didn't, in plain words. Usually "No mail provider configured",
  -- since we don't have a mail account yet.
);
