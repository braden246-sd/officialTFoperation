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