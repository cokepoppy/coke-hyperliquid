-- Migration: Add Google OAuth support to users table (Safe version)
-- Run this migration to enable Google login functionality

USE hyperliquid;

-- Check current table structure
SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'hyperliquid' AND TABLE_NAME = 'users';

-- Step 1: Add new columns if they don't exist
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'hyperliquid'
   AND TABLE_NAME = 'users'
   AND COLUMN_NAME = 'google_id') = 0,
  'ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL AFTER email',
  'SELECT ''Column google_id already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'hyperliquid'
   AND TABLE_NAME = 'users'
   AND COLUMN_NAME = 'name') = 0,
  'ALTER TABLE users ADD COLUMN name VARCHAR(255) DEFAULT NULL AFTER google_id',
  'SELECT ''Column name already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'hyperliquid'
   AND TABLE_NAME = 'users'
   AND COLUMN_NAME = 'avatar') = 0,
  'ALTER TABLE users ADD COLUMN avatar VARCHAR(512) DEFAULT NULL AFTER name',
  'SELECT ''Column avatar already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Make wallet_address nullable
ALTER TABLE users MODIFY wallet_address VARCHAR(42) DEFAULT NULL;

-- Step 3: Add unique indexes if they don't exist
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = 'hyperliquid'
   AND TABLE_NAME = 'users'
   AND INDEX_NAME = 'idx_email') = 0,
  'ALTER TABLE users ADD UNIQUE INDEX idx_email (email)',
  'SELECT ''Index idx_email already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = 'hyperliquid'
   AND TABLE_NAME = 'users'
   AND INDEX_NAME = 'idx_google_id') = 0,
  'ALTER TABLE users ADD UNIQUE INDEX idx_google_id (google_id)',
  'SELECT ''Index idx_google_id already exists'' AS message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Show final table structure
DESCRIBE users;

SELECT 'Migration completed successfully!' AS status;
