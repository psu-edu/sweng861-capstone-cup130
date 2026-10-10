ALTER TABLE housing_assignments
  DROP CONSTRAINT housing_assignments_application_unique;

CREATE UNIQUE INDEX housing_assignments_active_application_unique_idx
  ON housing_assignments(application_id)
  WHERE status IN (
    'RESERVED',
    'CONFIRMED'
  );