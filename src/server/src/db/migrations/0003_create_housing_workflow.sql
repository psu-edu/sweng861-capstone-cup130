CREATE TABLE housing_applications (
  id BIGSERIAL PRIMARY KEY,

  student_id BIGINT NOT NULL,
  academic_year VARCHAR(9) NOT NULL,

  preferred_building_id BIGINT NOT NULL,
  preferred_room_style VARCHAR(20) NOT NULL,

  status VARCHAR(30) NOT NULL,

  officer_notes TEXT,

  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by BIGINT,

  housing_assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  cancelled_at TIMESTAMPTZ,
  cancelled_by BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT housing_applications_student_fk
    FOREIGN KEY (student_id)
    REFERENCES student_profiles(user_id)
    ON DELETE RESTRICT,

  CONSTRAINT housing_applications_preferred_building_fk
    FOREIGN KEY (preferred_building_id)
    REFERENCES buildings(id)
    ON DELETE RESTRICT,

  CONSTRAINT housing_applications_approved_by_fk
    FOREIGN KEY (approved_by)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT housing_applications_cancelled_by_fk
    FOREIGN KEY (cancelled_by)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT housing_applications_academic_year_check
    CHECK (
      academic_year ~ '^[0-9]{4}-[0-9]{4}$'
    ),

  CONSTRAINT housing_applications_room_style_check
    CHECK (
      preferred_room_style IN (
        'SINGLE',
        'DOUBLE',
        'TRIPLE',
        'QUAD'
      )
    ),

  CONSTRAINT housing_applications_status_check
    CHECK (
      status IN (
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'HOUSING_ASSIGNED',
        'COMPLETED',
        'CANCELLED'
      )
    )
);

CREATE UNIQUE INDEX housing_applications_unsecured_student_unique_idx
  ON housing_applications(student_id)
  WHERE status IN (
    'DRAFT',
    'SUBMITTED',
    'APPROVED'
  );

CREATE INDEX housing_applications_student_id_idx
  ON housing_applications(student_id);

CREATE INDEX housing_applications_status_idx
  ON housing_applications(status);


CREATE TABLE housing_assignments (
  id BIGSERIAL PRIMARY KEY,

  application_id BIGINT NOT NULL,
  bed_id BIGINT NOT NULL,

  status VARCHAR(30) NOT NULL,

  reserved_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,

  cancelled_at TIMESTAMPTZ,
  cancelled_by BIGINT,

  superseded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT housing_assignments_application_fk
    FOREIGN KEY (application_id)
    REFERENCES housing_applications(id)
    ON DELETE RESTRICT,

  CONSTRAINT housing_assignments_application_unique
    UNIQUE (application_id),

  CONSTRAINT housing_assignments_bed_fk
    FOREIGN KEY (bed_id)
    REFERENCES beds(id)
    ON DELETE RESTRICT,

  CONSTRAINT housing_assignments_cancelled_by_fk
    FOREIGN KEY (cancelled_by)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT housing_assignments_status_check
    CHECK (
      status IN (
        'RESERVED',
        'CONFIRMED',
        'CANCELLED',
        'SUPERSEDED'
      )
    )
);

CREATE UNIQUE INDEX housing_assignments_active_bed_unique_idx
  ON housing_assignments(bed_id)
  WHERE status IN (
    'RESERVED',
    'CONFIRMED'
  );

CREATE INDEX housing_assignments_bed_id_idx
  ON housing_assignments(bed_id);

CREATE INDEX housing_assignments_status_idx
  ON housing_assignments(status);


CREATE TABLE leases (
  id BIGSERIAL PRIMARY KEY,

  assignment_id BIGINT NOT NULL,

  status VARCHAR(30) NOT NULL,

  document_path VARCHAR(500),
  external_envelope_id VARCHAR(255),

  generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,

  voided_at TIMESTAMPTZ,
  voided_by BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT leases_assignment_fk
    FOREIGN KEY (assignment_id)
    REFERENCES housing_assignments(id)
    ON DELETE RESTRICT,

  CONSTRAINT leases_assignment_unique
    UNIQUE (assignment_id),

  CONSTRAINT leases_external_envelope_unique
    UNIQUE (external_envelope_id),

  CONSTRAINT leases_voided_by_fk
    FOREIGN KEY (voided_by)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT leases_status_check
    CHECK (
      status IN (
        'PENDING',
        'GENERATED',
        'SENT_FOR_SIGNATURE',
        'SIGNED',
        'VOIDED'
      )
    )
);

CREATE INDEX leases_status_idx
  ON leases(status);