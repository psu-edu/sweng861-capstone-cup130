CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,

  auth_subject VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_auth_subject_unique
    UNIQUE (auth_subject),

  CONSTRAINT users_email_unique
    UNIQUE (email),

  CONSTRAINT users_role_check
    CHECK (
      role IN (
        'STUDENT',
        'HOUSING_OFFICER'
      )
    )
);

CREATE TABLE student_profiles (
  user_id BIGINT PRIMARY KEY,

  student_number VARCHAR(30) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,

  gender VARCHAR(20) NOT NULL,
  academic_status VARCHAR(30) NOT NULL,
  major VARCHAR(150) NOT NULL,

  anticipated_graduation_semester VARCHAR(20),
  anticipated_graduation_year INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT student_profiles_user_fk
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT,

  CONSTRAINT student_profiles_student_number_unique
    UNIQUE (student_number),

  CONSTRAINT student_profiles_gender_check
    CHECK (
      gender IN (
        'MALE',
        'FEMALE',
        'UNSPECIFIED'
      )
    ),

  CONSTRAINT student_profiles_academic_status_check
    CHECK (
      academic_status IN (
        'FRESHMAN',
        'SOPHOMORE',
        'JUNIOR',
        'SENIOR',
        'GRADUATE'
      )
    ),

  CONSTRAINT student_profiles_graduation_semester_check
    CHECK (
      anticipated_graduation_semester IS NULL
      OR anticipated_graduation_semester IN (
        'SPRING',
        'SUMMER',
        'FALL'
      )
    )
);