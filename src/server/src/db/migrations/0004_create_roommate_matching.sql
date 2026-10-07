CREATE TABLE roommate_profiles (
  student_id BIGINT PRIMARY KEY,

  opted_in BOOLEAN NOT NULL DEFAULT FALSE,

  sleep_schedule SMALLINT NOT NULL,
  wake_schedule SMALLINT NOT NULL,
  cleanliness SMALLINT NOT NULL,
  study_environment SMALLINT NOT NULL,
  noise_tolerance SMALLINT NOT NULL,
  social_preference SMALLINT NOT NULL,
  guest_frequency SMALLINT NOT NULL,
  room_use SMALLINT NOT NULL,
  sharing_preference SMALLINT NOT NULL,
  temperature_preference SMALLINT NOT NULL,
  communication_style SMALLINT NOT NULL,
  conflict_resolution SMALLINT NOT NULL,

  priority_1 VARCHAR(40),
  priority_2 VARCHAR(40),
  priority_3 VARCHAR(40),

  about_me TEXT,
  looking_for TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT roommate_profiles_student_fk
    FOREIGN KEY (student_id)
    REFERENCES student_profiles(user_id)
    ON DELETE RESTRICT,

  CONSTRAINT roommate_profiles_preference_range_check
    CHECK (
      sleep_schedule BETWEEN 1 AND 5
      AND wake_schedule BETWEEN 1 AND 5
      AND cleanliness BETWEEN 1 AND 5
      AND study_environment BETWEEN 1 AND 5
      AND noise_tolerance BETWEEN 1 AND 5
      AND social_preference BETWEEN 1 AND 5
      AND guest_frequency BETWEEN 1 AND 5
      AND room_use BETWEEN 1 AND 5
      AND sharing_preference BETWEEN 1 AND 5
      AND temperature_preference BETWEEN 1 AND 5
      AND communication_style BETWEEN 1 AND 5
      AND conflict_resolution BETWEEN 1 AND 5
    ),

  CONSTRAINT roommate_profiles_priority_1_check
    CHECK (
      priority_1 IS NULL
      OR priority_1 IN (
        'SLEEP_SCHEDULE',
        'WAKE_SCHEDULE',
        'CLEANLINESS',
        'STUDY_ENVIRONMENT',
        'NOISE_TOLERANCE',
        'SOCIAL_PREFERENCE',
        'GUEST_FREQUENCY',
        'ROOM_USE',
        'SHARING_PREFERENCE',
        'TEMPERATURE',
        'COMMUNICATION_STYLE',
        'CONFLICT_RESOLUTION'
      )
    ),

  CONSTRAINT roommate_profiles_priority_2_check
    CHECK (
      priority_2 IS NULL
      OR priority_2 IN (
        'SLEEP_SCHEDULE',
        'WAKE_SCHEDULE',
        'CLEANLINESS',
        'STUDY_ENVIRONMENT',
        'NOISE_TOLERANCE',
        'SOCIAL_PREFERENCE',
        'GUEST_FREQUENCY',
        'ROOM_USE',
        'SHARING_PREFERENCE',
        'TEMPERATURE',
        'COMMUNICATION_STYLE',
        'CONFLICT_RESOLUTION'
      )
    ),

  CONSTRAINT roommate_profiles_priority_3_check
    CHECK (
      priority_3 IS NULL
      OR priority_3 IN (
        'SLEEP_SCHEDULE',
        'WAKE_SCHEDULE',
        'CLEANLINESS',
        'STUDY_ENVIRONMENT',
        'NOISE_TOLERANCE',
        'SOCIAL_PREFERENCE',
        'GUEST_FREQUENCY',
        'ROOM_USE',
        'SHARING_PREFERENCE',
        'TEMPERATURE',
        'COMMUNICATION_STYLE',
        'CONFLICT_RESOLUTION'
      )
    ),

  CONSTRAINT roommate_profiles_priorities_unique_check
    CHECK (
      (priority_1 IS NULL OR priority_2 IS NULL OR priority_1 <> priority_2)
      AND
      (priority_1 IS NULL OR priority_3 IS NULL OR priority_1 <> priority_3)
      AND
      (priority_2 IS NULL OR priority_3 IS NULL OR priority_2 <> priority_3)
    )
);


CREATE TABLE roommate_requests (
  id BIGSERIAL PRIMARY KEY,

  requester_student_id BIGINT NOT NULL,
  requested_student_id BIGINT NOT NULL,

  academic_year VARCHAR(9) NOT NULL,
  status VARCHAR(30) NOT NULL,

  responded_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT roommate_requests_requester_fk
    FOREIGN KEY (requester_student_id)
    REFERENCES student_profiles(user_id)
    ON DELETE RESTRICT,

  CONSTRAINT roommate_requests_requested_fk
    FOREIGN KEY (requested_student_id)
    REFERENCES student_profiles(user_id)
    ON DELETE RESTRICT,

  CONSTRAINT roommate_requests_not_self_check
    CHECK (
      requester_student_id <> requested_student_id
    ),

  CONSTRAINT roommate_requests_academic_year_check
    CHECK (
      academic_year ~ '^[0-9]{4}-[0-9]{4}$'
    ),

  CONSTRAINT roommate_requests_status_check
    CHECK (
      status IN (
        'PENDING',
        'ACCEPTED',
        'DECLINED',
        'CANCELLED'
      )
    )
);

CREATE UNIQUE INDEX roommate_requests_active_pair_unique_idx
  ON roommate_requests (
    academic_year,
    LEAST(
      requester_student_id,
      requested_student_id
    ),
    GREATEST(
      requester_student_id,
      requested_student_id
    )
  )
  WHERE status IN (
    'PENDING',
    'ACCEPTED'
  );

CREATE INDEX roommate_requests_requester_idx
  ON roommate_requests(requester_student_id);

CREATE INDEX roommate_requests_requested_idx
  ON roommate_requests(requested_student_id);

CREATE INDEX roommate_requests_status_idx
  ON roommate_requests(status);