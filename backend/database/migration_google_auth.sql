-- Migration: Add Google OAuth support to users table
-- Run this migration to enable Google login functionality

USE hyperliquid;

-- Modify users table to support Google authentication
ALTER TABLE users
  -- Make wallet_address nullable (users can login with Google without wallet)
  MODIFY wallet_address VARCHAR(42) DEFAULT NULL,

  -- Remove UNIQUE constraint on wallet_address
  DROP INDEX wallet_address,

  -- Add Google OAuth fields
  ADD COLUMN google_id VARCHAR(255) DEFAULT NULL AFTER email,
  ADD COLUMN name VARCHAR(255) DEFAULT NULL AFTER google_id,
  ADD COLUMN avatar VARCHAR(512) DEFAULT NULL AFTER name,

  -- Add unique constraints
  ADD UNIQUE INDEX idx_wallet_address (wallet_address),
  ADD UNIQUE INDEX idx_email (email),
  ADD UNIQUE INDEX idx_google_id (google_id);

-- Add check constraint: user must have either wallet_address or email
-- Note: MySQL 8.0.16+ supports CHECK constraints
-- ALTER TABLE users
--   ADD CONSTRAINT chk_user_identity
--   CHECK (wallet_address IS NOT NULL OR email IS NOT NULL);
