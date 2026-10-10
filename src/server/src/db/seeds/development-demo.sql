-- Campus Rental deterministic development/demo data.
--
-- These records are intentionally fictional and contain no real
-- credentials or student information.

-- ============================================================
-- Users
-- ============================================================

INSERT INTO users (
  auth_subject,
  email,
  role,
  created_at,
  updated_at
)
VALUES
  (
    'demo|housing-officer',
    'housing.officer@campusrental.test',
    'HOUSING_OFFICER',
    '2026-08-01T12:00:00Z',
    '2026-08-01T12:00:00Z'
  ),
  (
    'demo|alex-morgan',
    'alex.morgan@campusrental.test',
    'STUDENT',
    '2026-08-01T12:00:00Z',
    '2026-08-01T12:00:00Z'
  ),
  (
    'demo|jordan-lee',
    'jordan.lee@campusrental.test',
    'STUDENT',
    '2026-08-01T12:00:00Z',
    '2026-08-01T12:00:00Z'
  ),
  (
    'demo|taylor-brooks',
    'taylor.brooks@campusrental.test',
    'STUDENT',
    '2026-08-01T12:00:00Z',
    '2026-08-01T12:00:00Z'
  ),
  (
    'demo|casey-nguyen',
    'casey.nguyen@campusrental.test',
    'STUDENT',
    '2026-08-01T12:00:00Z',
    '2026-08-01T12:00:00Z'
  )
ON CONFLICT DO NOTHING;


-- ============================================================
-- Student Profiles
-- ============================================================

INSERT INTO student_profiles (
  user_id,
  student_number,
  first_name,
  last_name,
  gender,
  academic_status,
  major,
  anticipated_graduation_semester,
  anticipated_graduation_year,
  created_at,
  updated_at
)
SELECT
  id,
  'CR0001',
  'Alex',
  'Morgan',
  'MALE',
  'SENIOR',
  'Computer Science',
  'SPRING',
  2027,
  '2026-08-01T12:00:00Z',
  '2026-08-01T12:00:00Z'
FROM users
WHERE auth_subject = 'demo|alex-morgan'
ON CONFLICT (user_id)
DO UPDATE
SET
  gender = EXCLUDED.gender,
  updated_at = EXCLUDED.updated_at;

INSERT INTO student_profiles (
  user_id,
  student_number,
  first_name,
  last_name,
  gender,
  academic_status,
  major,
  anticipated_graduation_semester,
  anticipated_graduation_year,
  created_at,
  updated_at
)
SELECT
  id,
  'CR0002',
  'Jordan',
  'Lee',
  'MALE',
  'JUNIOR',
  'Information Sciences and Technology',
  'SPRING',
  2028,
  '2026-08-01T12:00:00Z',
  '2026-08-01T12:00:00Z'
FROM users
WHERE auth_subject = 'demo|jordan-lee'
ON CONFLICT (user_id)
DO UPDATE
SET
  gender = EXCLUDED.gender,
  updated_at = EXCLUDED.updated_at;

INSERT INTO student_profiles (
  user_id,
  student_number,
  first_name,
  last_name,
  gender,
  academic_status,
  major,
  anticipated_graduation_semester,
  anticipated_graduation_year,
  created_at,
  updated_at
)
SELECT
  id,
  'CR0003',
  'Taylor',
  'Brooks',
  'FEMALE',
  'GRADUATE',
  'Software Engineering',
  'FALL',
  2027,
  '2026-08-01T12:00:00Z',
  '2026-08-01T12:00:00Z'
FROM users
WHERE auth_subject = 'demo|taylor-brooks'
ON CONFLICT (user_id)
DO UPDATE
SET
  gender = EXCLUDED.gender,
  updated_at = EXCLUDED.updated_at;

INSERT INTO student_profiles (
  user_id,
  student_number,
  first_name,
  last_name,
  gender,
  academic_status,
  major,
  anticipated_graduation_semester,
  anticipated_graduation_year,
  created_at,
  updated_at
)
SELECT
  id,
  'CR0004',
  'Casey',
  'Nguyen',
  'FEMALE',
  'SOPHOMORE',
  'Engineering',
  'SPRING',
  2029,
  '2026-08-01T12:00:00Z',
  '2026-08-01T12:00:00Z'
FROM users
WHERE auth_subject = 'demo|casey-nguyen'
ON CONFLICT (user_id)
DO UPDATE
SET
  gender = EXCLUDED.gender,
  updated_at = EXCLUDED.updated_at;


-- ============================================================
-- Buildings
-- ============================================================

INSERT INTO buildings (
  name,
  address,
  description,
  active,
  created_at,
  updated_at
)
VALUES
  (
    'East Residence Hall',
    '100 University Avenue',
    'Residence hall with single and double rooms.',
    TRUE,
    '2026-08-01T12:00:00Z',
    '2026-08-01T12:00:00Z'
  ),
  (
    'West Residence Hall',
    '200 University Avenue',
    'Residence hall with double and triple rooms.',
    TRUE,
    '2026-08-01T12:00:00Z',
    '2026-08-01T12:00:00Z'
  )
ON CONFLICT DO NOTHING;


-- ============================================================
-- Rooms
-- ============================================================

INSERT INTO rooms (
  building_id,
  room_number,
  floor,
  room_style
)
SELECT id, '201', 2, 'DOUBLE'
FROM buildings
WHERE name = 'East Residence Hall'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (
  building_id,
  room_number,
  floor,
  room_style
)
SELECT id, '202', 2, 'SINGLE'
FROM buildings
WHERE name = 'East Residence Hall'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (
  building_id,
  room_number,
  floor,
  room_style
)
SELECT id, '301', 3, 'DOUBLE'
FROM buildings
WHERE name = 'West Residence Hall'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (
  building_id,
  room_number,
  floor,
  room_style
)
SELECT id, '302', 3, 'TRIPLE'
FROM buildings
WHERE name = 'West Residence Hall'
ON CONFLICT DO NOTHING;


-- ============================================================
-- Beds
-- ============================================================

INSERT INTO beds (
  room_id,
  bed_label
)
SELECT id, 'A'
FROM rooms
WHERE room_number = '201'
  AND building_id = (
    SELECT id
    FROM buildings
    WHERE name = 'East Residence Hall'
  )
ON CONFLICT DO NOTHING;

INSERT INTO beds (
  room_id,
  bed_label
)
SELECT id, 'B'
FROM rooms
WHERE room_number = '201'
  AND building_id = (
    SELECT id
    FROM buildings
    WHERE name = 'East Residence Hall'
  )
ON CONFLICT DO NOTHING;

INSERT INTO beds (
  room_id,
  bed_label
)
SELECT id, 'A'
FROM rooms
WHERE room_number = '202'
  AND building_id = (
    SELECT id
    FROM buildings
    WHERE name = 'East Residence Hall'
  )
ON CONFLICT DO NOTHING;

INSERT INTO beds (
  room_id,
  bed_label
)
SELECT id, 'A'
FROM rooms
WHERE room_number = '301'
  AND building_id = (
    SELECT id
    FROM buildings
    WHERE name = 'West Residence Hall'
  )
ON CONFLICT DO NOTHING;

INSERT INTO beds (
  room_id,
  bed_label
)
SELECT id, 'B'
FROM rooms
WHERE room_number = '301'
  AND building_id = (
    SELECT id
    FROM buildings
    WHERE name = 'West Residence Hall'
  )
ON CONFLICT DO NOTHING;

INSERT INTO beds (
  room_id,
  bed_label
)
SELECT id, 'A'
FROM rooms
WHERE room_number = '302'
  AND building_id = (
    SELECT id
    FROM buildings
    WHERE name = 'West Residence Hall'
  )
ON CONFLICT DO NOTHING;

INSERT INTO beds (
  room_id,
  bed_label
)
SELECT id, 'B'
FROM rooms
WHERE room_number = '302'
  AND building_id = (
    SELECT id
    FROM buildings
    WHERE name = 'West Residence Hall'
  )
ON CONFLICT DO NOTHING;

INSERT INTO beds (
  room_id,
  bed_label
)
SELECT id, 'C'
FROM rooms
WHERE room_number = '302'
  AND building_id = (
    SELECT id
    FROM buildings
    WHERE name = 'West Residence Hall'
  )
ON CONFLICT DO NOTHING;


-- ============================================================
-- Housing Applications
-- ============================================================

-- Alex: Approved and waiting for assignment.
INSERT INTO housing_applications (
  student_id,
  academic_year,
  preferred_building_id,
  preferred_room_style,
  status,
  submitted_at,
  approved_at,
  approved_by,
  created_at,
  updated_at
)
SELECT
  student.user_id,
  '2026-2027',
  building.id,
  'DOUBLE',
  'APPROVED',
  '2026-08-10T14:00:00Z',
  '2026-08-12T14:00:00Z',
  officer.id,
  '2026-08-08T14:00:00Z',
  '2026-08-12T14:00:00Z'
FROM student_profiles student
JOIN users student_user
  ON student_user.id = student.user_id
CROSS JOIN buildings building
CROSS JOIN users officer
WHERE student_user.auth_subject = 'demo|alex-morgan'
  AND building.name = 'East Residence Hall'
  AND officer.auth_subject = 'demo|housing-officer'
  AND NOT EXISTS (
    SELECT 1
    FROM housing_applications existing
    WHERE existing.student_id = student.user_id
      AND existing.academic_year = '2026-2027'
      AND existing.status = 'APPROVED'
  );


-- Jordan: Housing assigned with a generated lease.
INSERT INTO housing_applications (
  student_id,
  academic_year,
  preferred_building_id,
  preferred_room_style,
  status,
  submitted_at,
  approved_at,
  approved_by,
  housing_assigned_at,
  created_at,
  updated_at
)
SELECT
  student.user_id,
  '2026-2027',
  building.id,
  'DOUBLE',
  'HOUSING_ASSIGNED',
  '2026-08-09T14:00:00Z',
  '2026-08-11T14:00:00Z',
  officer.id,
  '2026-08-15T14:00:00Z',
  '2026-08-07T14:00:00Z',
  '2026-08-15T14:00:00Z'
FROM student_profiles student
JOIN users student_user
  ON student_user.id = student.user_id
CROSS JOIN buildings building
CROSS JOIN users officer
WHERE student_user.auth_subject = 'demo|jordan-lee'
  AND building.name = 'East Residence Hall'
  AND officer.auth_subject = 'demo|housing-officer'
  AND NOT EXISTS (
    SELECT 1
    FROM housing_applications existing
    WHERE existing.student_id = student.user_id
      AND existing.academic_year = '2026-2027'
      AND existing.status = 'HOUSING_ASSIGNED'
  );


-- Taylor: Completed workflow.
INSERT INTO housing_applications (
  student_id,
  academic_year,
  preferred_building_id,
  preferred_room_style,
  status,
  submitted_at,
  approved_at,
  approved_by,
  housing_assigned_at,
  completed_at,
  created_at,
  updated_at
)
SELECT
  student.user_id,
  '2026-2027',
  building.id,
  'DOUBLE',
  'COMPLETED',
  '2026-08-05T14:00:00Z',
  '2026-08-06T14:00:00Z',
  officer.id,
  '2026-08-08T14:00:00Z',
  '2026-08-20T14:00:00Z',
  '2026-08-04T14:00:00Z',
  '2026-08-20T14:00:00Z'
FROM student_profiles student
JOIN users student_user
  ON student_user.id = student.user_id
CROSS JOIN buildings building
CROSS JOIN users officer
WHERE student_user.auth_subject = 'demo|taylor-brooks'
  AND building.name = 'West Residence Hall'
  AND officer.auth_subject = 'demo|housing-officer'
  AND NOT EXISTS (
    SELECT 1
    FROM housing_applications existing
    WHERE existing.student_id = student.user_id
      AND existing.academic_year = '2026-2027'
      AND existing.status = 'COMPLETED'
  );


-- Casey: Draft application.
INSERT INTO housing_applications (
  student_id,
  academic_year,
  preferred_building_id,
  preferred_room_style,
  status,
  created_at,
  updated_at
)
SELECT
  student.user_id,
  '2026-2027',
  building.id,
  'TRIPLE',
  'DRAFT',
  '2026-08-18T14:00:00Z',
  '2026-08-18T14:00:00Z'
FROM student_profiles student
JOIN users student_user
  ON student_user.id = student.user_id
CROSS JOIN buildings building
WHERE student_user.auth_subject = 'demo|casey-nguyen'
  AND building.name = 'West Residence Hall'
  AND NOT EXISTS (
    SELECT 1
    FROM housing_applications existing
    WHERE existing.student_id = student.user_id
      AND existing.academic_year = '2026-2027'
      AND existing.status = 'DRAFT'
  );


-- ============================================================
-- Housing Assignments
-- ============================================================

-- Jordan: Reserved East 201 A.
INSERT INTO housing_assignments (
  application_id,
  bed_id,
  status,
  reserved_at,
  created_at,
  updated_at
)
SELECT
  application.id,
  bed.id,
  'RESERVED',
  '2026-08-15T14:00:00Z',
  '2026-08-15T14:00:00Z',
  '2026-08-15T14:00:00Z'
FROM housing_applications application
JOIN student_profiles student
  ON student.user_id = application.student_id
JOIN users student_user
  ON student_user.id = student.user_id
JOIN rooms room
  ON room.room_number = '201'
JOIN buildings building
  ON building.id = room.building_id
JOIN beds bed
  ON bed.room_id = room.id
WHERE student_user.auth_subject = 'demo|jordan-lee'
  AND application.status = 'HOUSING_ASSIGNED'
  AND building.name = 'East Residence Hall'
  AND bed.bed_label = 'A'
ON CONFLICT DO NOTHING;


-- Taylor: Confirmed West 301 A.
INSERT INTO housing_assignments (
  application_id,
  bed_id,
  status,
  reserved_at,
  confirmed_at,
  created_at,
  updated_at
)
SELECT
  application.id,
  bed.id,
  'CONFIRMED',
  '2026-08-08T14:00:00Z',
  '2026-08-20T14:00:00Z',
  '2026-08-08T14:00:00Z',
  '2026-08-20T14:00:00Z'
FROM housing_applications application
JOIN student_profiles student
  ON student.user_id = application.student_id
JOIN users student_user
  ON student_user.id = student.user_id
JOIN rooms room
  ON room.room_number = '301'
JOIN buildings building
  ON building.id = room.building_id
JOIN beds bed
  ON bed.room_id = room.id
WHERE student_user.auth_subject = 'demo|taylor-brooks'
  AND application.status = 'COMPLETED'
  AND building.name = 'West Residence Hall'
  AND bed.bed_label = 'A'
ON CONFLICT DO NOTHING;


-- ============================================================
-- Leases
-- ============================================================

-- Jordan: Lease generated but not yet sent/signed.
INSERT INTO leases (
  assignment_id,
  status,
  document_path,
  generated_at,
  created_at,
  updated_at
)
SELECT
  assignment.id,
  'GENERATED',
  'generated-leases/demo-jordan-lee.pdf',
  '2026-08-16T14:00:00Z',
  '2026-08-16T14:00:00Z',
  '2026-08-16T14:00:00Z'
FROM housing_assignments assignment
JOIN housing_applications application
  ON application.id = assignment.application_id
JOIN users student_user
  ON student_user.id = application.student_id
WHERE student_user.auth_subject = 'demo|jordan-lee'
ON CONFLICT DO NOTHING;


-- Taylor: Signed lease.
INSERT INTO leases (
  assignment_id,
  status,
  document_path,
  external_envelope_id,
  generated_at,
  sent_at,
  signed_at,
  created_at,
  updated_at
)
SELECT
  assignment.id,
  'SIGNED',
  'generated-leases/demo-taylor-brooks.pdf',
  'demo-envelope-taylor-001',
  '2026-08-09T14:00:00Z',
  '2026-08-10T14:00:00Z',
  '2026-08-20T14:00:00Z',
  '2026-08-09T14:00:00Z',
  '2026-08-20T14:00:00Z'
FROM housing_assignments assignment
JOIN housing_applications application
  ON application.id = assignment.application_id
JOIN users student_user
  ON student_user.id = application.student_id
WHERE student_user.auth_subject = 'demo|taylor-brooks'
ON CONFLICT DO NOTHING;


-- ============================================================
-- Roommate Profiles
-- ============================================================

INSERT INTO roommate_profiles (
  student_id,
  opted_in,
  sleep_schedule,
  wake_schedule,
  cleanliness,
  study_environment,
  noise_tolerance,
  social_preference,
  guest_frequency,
  room_use,
  sharing_preference,
  temperature_preference,
  communication_style,
  conflict_resolution,
  priority_1,
  priority_2,
  priority_3,
  about_me,
  looking_for
)
SELECT
  user_id,
  TRUE,
  3,
  3,
  5,
  2,
  2,
  3,
  2,
  3,
  3,
  2,
  4,
  4,
  'CLEANLINESS',
  'STUDY_ENVIRONMENT',
  'COMMUNICATION_STYLE',
  'I enjoy a quiet room and keep shared spaces organized.',
  'Looking for a respectful roommate with similar study habits.'
FROM student_profiles
WHERE student_number = 'CR0001'
ON CONFLICT DO NOTHING;

INSERT INTO roommate_profiles (
  student_id,
  opted_in,
  sleep_schedule,
  wake_schedule,
  cleanliness,
  study_environment,
  noise_tolerance,
  social_preference,
  guest_frequency,
  room_use,
  sharing_preference,
  temperature_preference,
  communication_style,
  conflict_resolution,
  priority_1,
  priority_2,
  priority_3,
  about_me,
  looking_for
)
SELECT
  user_id,
  TRUE,
  3,
  3,
  4,
  2,
  3,
  4,
  3,
  3,
  4,
  3,
  4,
  4,
  'COMMUNICATION_STYLE',
  'CLEANLINESS',
  'SOCIAL_PREFERENCE',
  'I am social but like a calm room during the week.',
  'Looking for someone who communicates clearly about shared space.'
FROM student_profiles
WHERE student_number = 'CR0002'
ON CONFLICT DO NOTHING;

INSERT INTO roommate_profiles (
  student_id,
  opted_in,
  sleep_schedule,
  wake_schedule,
  cleanliness,
  study_environment,
  noise_tolerance,
  social_preference,
  guest_frequency,
  room_use,
  sharing_preference,
  temperature_preference,
  communication_style,
  conflict_resolution,
  priority_1,
  priority_2,
  priority_3,
  about_me,
  looking_for
)
SELECT
  user_id,
  FALSE,
  2,
  2,
  4,
  3,
  3,
  3,
  2,
  4,
  3,
  3,
  5,
  5,
  'COMMUNICATION_STYLE',
  'CONFLICT_RESOLUTION',
  'CLEANLINESS',
  'Graduate student focused on coursework and project work.',
  'Looking for a roommate who is considerate and direct.'
FROM student_profiles
WHERE student_number = 'CR0003'
ON CONFLICT DO NOTHING;

INSERT INTO roommate_profiles (
  student_id,
  opted_in,
  sleep_schedule,
  wake_schedule,
  cleanliness,
  study_environment,
  noise_tolerance,
  social_preference,
  guest_frequency,
  room_use,
  sharing_preference,
  temperature_preference,
  communication_style,
  conflict_resolution,
  priority_1,
  priority_2,
  priority_3,
  about_me,
  looking_for
)
SELECT
  user_id,
  TRUE,
  4,
  4,
  3,
  3,
  4,
  4,
  3,
  3,
  3,
  3,
  4,
  4,
  'SOCIAL_PREFERENCE',
  'NOISE_TOLERANCE',
  'GUEST_FREQUENCY',
  'I enjoy campus activities and spending time with friends.',
  'Looking for someone with compatible social and guest preferences.'
FROM student_profiles
WHERE student_number = 'CR0004'
ON CONFLICT DO NOTHING;


-- ============================================================
-- Roommate Requests
-- ============================================================

-- Alex has a pending request to Jordan.
INSERT INTO roommate_requests (
  requester_student_id,
  requested_student_id,
  academic_year,
  status,
  created_at,
  updated_at
)
SELECT
  requester.user_id,
  requested.user_id,
  '2026-2027',
  'PENDING',
  '2026-08-18T14:00:00Z',
  '2026-08-18T14:00:00Z'
FROM student_profiles requester
CROSS JOIN student_profiles requested
WHERE requester.student_number = 'CR0001'
  AND requested.student_number = 'CR0002'
  AND NOT EXISTS (
    SELECT 1
    FROM roommate_requests existing
    WHERE existing.requester_student_id = requester.user_id
      AND existing.requested_student_id = requested.user_id
      AND existing.academic_year = '2026-2027'
      AND existing.status = 'PENDING'
  );


-- Taylor and Casey have an accepted request.
INSERT INTO roommate_requests (
  requester_student_id,
  requested_student_id,
  academic_year,
  status,
  responded_at,
  created_at,
  updated_at
)
SELECT
  requester.user_id,
  requested.user_id,
  '2026-2027',
  'ACCEPTED',
  '2026-08-12T14:00:00Z',
  '2026-08-11T14:00:00Z',
  '2026-08-12T14:00:00Z'
FROM student_profiles requester
CROSS JOIN student_profiles requested
WHERE requester.student_number = 'CR0003'
  AND requested.student_number = 'CR0004'
  AND NOT EXISTS (
    SELECT 1
    FROM roommate_requests existing
    WHERE existing.requester_student_id = requester.user_id
      AND existing.requested_student_id = requested.user_id
      AND existing.academic_year = '2026-2027'
      AND existing.status = 'ACCEPTED'
  );