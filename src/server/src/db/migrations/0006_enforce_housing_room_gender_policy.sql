CREATE OR REPLACE FUNCTION enforce_housing_room_gender_policy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_room_id BIGINT;
  student_gender VARCHAR(20);
  incompatible_occupant_exists BOOLEAN;
BEGIN
  IF NEW.status NOT IN (
    'RESERVED',
    'CONFIRMED'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT
    bed.room_id
  INTO
    target_room_id
  FROM beds bed
  WHERE bed.id = NEW.bed_id;

  IF target_room_id IS NULL THEN
    RETURN NEW;
  END IF;

  /*
   * Assignment operations are serialized at the
   * room level so two simultaneous assignments
   * cannot independently treat the same room as
   * empty and create mixed-gender occupancy.
   */
  PERFORM 1
  FROM rooms room
  WHERE room.id = target_room_id
  FOR UPDATE;

  SELECT
    profile.gender
  INTO
    student_gender
  FROM housing_applications application
  JOIN student_profiles profile
    ON profile.user_id =
      application.student_id
  WHERE application.id =
    NEW.application_id;

  IF student_gender IS NULL THEN
    RETURN NEW;
  END IF;

  IF student_gender = 'UNSPECIFIED' THEN
    /*
     * UNSPECIFIED students may only occupy a room
     * when no other active assignment exists.
     */
    SELECT EXISTS (
      SELECT 1
      FROM housing_assignments
        existing_assignment
      JOIN beds existing_bed
        ON existing_bed.id =
          existing_assignment.bed_id
      WHERE existing_bed.room_id =
        target_room_id
        AND existing_assignment.status IN (
          'RESERVED',
          'CONFIRMED'
        )
        AND existing_assignment.id
          IS DISTINCT FROM NEW.id
    )
    INTO incompatible_occupant_exists;
  ELSE
    /*
     * MALE and FEMALE students may share only
     * with active occupants of the same gender.
     * An existing UNSPECIFIED occupant therefore
     * also makes the room incompatible.
     */
    SELECT EXISTS (
      SELECT 1
      FROM housing_assignments
        existing_assignment
      JOIN housing_applications
        existing_application
        ON existing_application.id =
          existing_assignment.application_id
      JOIN student_profiles
        existing_profile
        ON existing_profile.user_id =
          existing_application.student_id
      JOIN beds existing_bed
        ON existing_bed.id =
          existing_assignment.bed_id
      WHERE existing_bed.room_id =
        target_room_id
        AND existing_assignment.status IN (
          'RESERVED',
          'CONFIRMED'
        )
        AND existing_assignment.id
          IS DISTINCT FROM NEW.id
        AND existing_profile.gender
          <> student_gender
    )
    INTO incompatible_occupant_exists;
  END IF;

  IF incompatible_occupant_exists THEN
    RAISE EXCEPTION
      'Housing assignment violates the room gender occupancy policy.'
      USING
        ERRCODE = '23505',
        CONSTRAINT =
          'housing_assignments_room_gender_policy';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  housing_assignments_room_gender_policy_trigger
ON housing_assignments;

CREATE TRIGGER
  housing_assignments_room_gender_policy_trigger
BEFORE INSERT
  OR UPDATE OF
    application_id,
    bed_id,
    status
ON housing_assignments
FOR EACH ROW
EXECUTE FUNCTION
  enforce_housing_room_gender_policy();