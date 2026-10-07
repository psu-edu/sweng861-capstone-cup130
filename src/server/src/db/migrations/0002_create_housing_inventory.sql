CREATE TABLE buildings (
  id BIGSERIAL PRIMARY KEY,

  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT buildings_name_unique
    UNIQUE (name)
);

CREATE TABLE rooms (
  id BIGSERIAL PRIMARY KEY,

  building_id BIGINT NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  floor INTEGER,
  room_style VARCHAR(20) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rooms_building_fk
    FOREIGN KEY (building_id)
    REFERENCES buildings(id)
    ON DELETE RESTRICT,

  CONSTRAINT rooms_building_room_number_unique
    UNIQUE (
      building_id,
      room_number
    ),

  CONSTRAINT rooms_room_style_check
    CHECK (
      room_style IN (
        'SINGLE',
        'DOUBLE',
        'TRIPLE',
        'QUAD'
      )
    )
);

CREATE TABLE beds (
  id BIGSERIAL PRIMARY KEY,

  room_id BIGINT NOT NULL,
  bed_label VARCHAR(20) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT beds_room_fk
    FOREIGN KEY (room_id)
    REFERENCES rooms(id)
    ON DELETE RESTRICT,

  CONSTRAINT beds_room_bed_label_unique
    UNIQUE (
      room_id,
      bed_label
    )
);

CREATE INDEX rooms_building_id_idx
  ON rooms(building_id);

CREATE INDEX beds_room_id_idx
  ON beds(room_id);