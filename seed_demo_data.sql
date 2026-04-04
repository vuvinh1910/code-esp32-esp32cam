BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Deterministic demo IDs
-- users
--   admin    = 11111111-1111-1111-1111-111111111111
--   operator = 22222222-2222-2222-2222-222222222222
-- devices
--   control 1 = aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1
--   control 2 = aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2
--   vision    = aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3

DELETE FROM device_commands
WHERE device_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid
);

DELETE FROM pump_action_logs
WHERE device_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid
);

DELETE FROM sensor_data
WHERE device_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid
);

DELETE FROM watering_configs
WHERE device_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid
);

DELETE FROM devices
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid
)
OR mac_address IN ('AA:BB:CC:DD:EE:01', 'AA:BB:CC:DD:EE:02', 'AA:BB:CC:DD:EE:03');

DELETE FROM users
WHERE id IN (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid
)
OR username IN ('admin', 'operator')
OR email IN ('admin@plantos.local', 'operator@plantos.local');

DELETE FROM ota_firmwares
WHERE version IN ('v2.3.1', 'v2.3.0', 'v2.2.5');

INSERT INTO users (id, created_at, updated_at, email, password_hash, role, username)
VALUES
(
  '11111111-1111-1111-1111-111111111111',
  NOW(),
  NOW(),
  'admin@plantos.local',
  crypt('admin123', gen_salt('bf')),
  'ADMIN',
  'admin'
),
(
  '22222222-2222-2222-2222-222222222222',
  NOW(),
  NOW(),
  'operator@plantos.local',
  crypt('user123', gen_salt('bf')),
  'USER',
  'operator'
);

INSERT INTO devices (
  id, created_at, updated_at, current_firmware_version, device_type,
  last_seen_at, location, mac_address, name, status, user_id
)
VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  NOW(),
  NOW(),
  'v2.3.1',
  'CONTROL_NODE',
  NOW() - INTERVAL '1 minute',
  'Balcony - Floor 3',
  'AA:BB:CC:DD:EE:01',
  'Irrigation Node A1',
  'ONLINE',
  '11111111-1111-1111-1111-111111111111'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  NOW(),
  NOW(),
  'v2.3.0',
  'CONTROL_NODE',
  NOW() - INTERVAL '4 minutes',
  'Rooftop Garden',
  'AA:BB:CC:DD:EE:02',
  'Irrigation Node B2',
  'ONLINE',
  '22222222-2222-2222-2222-222222222222'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  NOW(),
  NOW(),
  'v2.2.5',
  'VISION_NODE',
  NOW() - INTERVAL '11 minutes',
  'Greenhouse Entry',
  'AA:BB:CC:DD:EE:03',
  'Vision Node C3',
  'OFFLINE',
  '11111111-1111-1111-1111-111111111111'
);

INSERT INTO watering_configs (
  id, created_at, updated_at, max_soil_moisture, min_soil_moisture, override_by_weather, device_id
)
VALUES
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  NOW(),
  NOW(),
  62.0,
  38.0,
  TRUE,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  NOW(),
  NOW(),
  58.0,
  34.0,
  FALSE,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'
);

INSERT INTO ota_firmwares (
  id, created_at, updated_at, awss3url, release_notes, released_at, target_device_type, version
)
VALUES
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc1',
  NOW(),
  NOW(),
  'https://example-bucket.s3.amazonaws.com/fw/control/v2.3.1.bin',
  'Stability improvements, better moisture filtering, and command retry optimization.',
  NOW() - INTERVAL '2 days',
  'CONTROL_NODE',
  'v2.3.1'
),
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc2',
  NOW(),
  NOW(),
  'https://example-bucket.s3.amazonaws.com/fw/control/v2.3.0.bin',
  'Added OTA command acknowledgements and improved sensor sampling cadence.',
  NOW() - INTERVAL '16 days',
  'CONTROL_NODE',
  'v2.3.0'
),
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc3',
  NOW(),
  NOW(),
  'https://example-bucket.s3.amazonaws.com/fw/vision/v2.2.5.bin',
  'Vision node maintenance release.',
  NOW() - INTERVAL '35 days',
  'VISION_NODE',
  'v2.2.5'
);

-- 24h sample for dashboard chart (device A1)
INSERT INTO sensor_data (air_humidity, air_temperature, light_level, recorded_at, soil_moisture, device_id)
SELECT
  ROUND((60 + COS(i / 4.0) * 8)::numeric, 1),
  ROUND((27 + SIN(i / 5.0) * 2.5)::numeric, 1),
  ROUND((2600 + SIN(i / 3.0) * 850)::numeric, 0),
  NOW() - ((23 - i) * INTERVAL '1 hour'),
  ROUND((48 + SIN(i / 2.5) * 14)::numeric, 1),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid
FROM generate_series(0, 23) AS g(i);

-- Additional points for device B2
INSERT INTO sensor_data (air_humidity, air_temperature, light_level, recorded_at, soil_moisture, device_id)
SELECT
  ROUND((58 + COS(i / 3.0) * 6)::numeric, 1),
  ROUND((28 + SIN(i / 4.0) * 2.0)::numeric, 1),
  ROUND((2400 + SIN(i / 2.2) * 700)::numeric, 0),
  NOW() - ((11 - i) * INTERVAL '2 hour'),
  ROUND((44 + SIN(i / 2.0) * 10)::numeric, 1),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid
FROM generate_series(0, 11) AS g(i);

INSERT INTO pump_action_logs (action, timestamp, triggered_by, device_id)
VALUES
('TURN_ON',  NOW() - INTERVAL '6 hours 10 minutes', 'AUTO_SOIL',  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
('TURN_OFF', NOW() - INTERVAL '6 hours  4 minutes', 'AUTO_SOIL',  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
('TURN_ON',  NOW() - INTERVAL '3 hours 48 minutes', 'MANUAL_APP', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
('TURN_OFF', NOW() - INTERVAL '3 hours 44 minutes', 'MANUAL_APP', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
('TURN_ON',  NOW() - INTERVAL '95 minutes',         'AUTO_SOIL',  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
('TURN_OFF', NOW() - INTERVAL '89 minutes',         'AUTO_SOIL',  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
('TURN_ON',  NOW() - INTERVAL '31 minutes',         'AUTO_SOIL',  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
('TURN_OFF', NOW() - INTERVAL '26 minutes',         'AUTO_SOIL',  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2');

INSERT INTO device_commands (action, command_type, created_at, executed_at, status, device_id)
VALUES
('TURN_ON',  'PUMP', NOW() - INTERVAL '31 minutes', NOW() - INTERVAL '30 minutes', 'ACKNOWLEDGED', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
('TURN_OFF', 'PUMP', NOW() - INTERVAL '26 minutes', NOW() - INTERVAL '25 minutes', 'ACKNOWLEDGED', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
('TURN_ON',  'PUMP', NOW() - INTERVAL '4 minutes',  NULL,                         'PENDING',      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1');

COMMIT;
