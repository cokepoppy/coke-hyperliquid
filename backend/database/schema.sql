-- Hyperliquid Clone Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS hyperliquid CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hyperliquid;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL UNIQUE,
  email VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_wallet_address (wallet_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trading pairs table
CREATE TABLE IF NOT EXISTS trading_pairs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  base_asset VARCHAR(10) NOT NULL,
  quote_asset VARCHAR(10) NOT NULL,
  type ENUM('SPOT', 'PERPETUAL') NOT NULL,
  min_order_size DECIMAL(20, 8) NOT NULL,
  max_order_size DECIMAL(20, 8) NOT NULL,
  tick_size DECIMAL(20, 8) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'DELISTED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_symbol (symbol),
  INDEX idx_type (type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(36) PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side ENUM('BUY', 'SELL') NOT NULL,
  type ENUM('LIMIT', 'MARKET', 'STOP_LIMIT', 'STOP_MARKET') NOT NULL,
  price DECIMAL(20, 8) DEFAULT NULL,
  stop_price DECIMAL(20, 8) DEFAULT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  filled_quantity DECIMAL(20, 8) DEFAULT 0,
  remaining_quantity DECIMAL(20, 8) NOT NULL,
  status ENUM('PENDING', 'OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED') NOT NULL,
  time_in_force ENUM('GTC', 'IOC', 'FOK', 'POST_ONLY') DEFAULT 'GTC',
  reduce_only TINYINT(1) DEFAULT 0,
  post_only TINYINT(1) DEFAULT 0,
  signature TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_symbol (symbol),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
  position_id VARCHAR(36) PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side ENUM('LONG', 'SHORT') NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  mark_price DECIMAL(20, 8) NOT NULL,
  liquidation_price DECIMAL(20, 8) NOT NULL,
  leverage INT NOT NULL,
  margin DECIMAL(20, 8) NOT NULL,
  unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
  realized_pnl DECIMAL(20, 8) DEFAULT 0,
  margin_mode ENUM('CROSS', 'ISOLATED') DEFAULT 'CROSS',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_symbol (symbol),
  UNIQUE KEY unique_user_symbol_side (user_id, symbol, side)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assets table (user balances)
CREATE TABLE IF NOT EXISTS assets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  asset VARCHAR(10) NOT NULL,
  free DECIMAL(20, 8) DEFAULT 0,
  locked DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_asset (user_id, asset),
  INDEX idx_user_id (user_id),
  INDEX idx_asset (asset)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trades table (execution history)
CREATE TABLE IF NOT EXISTS trades (
  trade_id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side ENUM('BUY', 'SELL') NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) DEFAULT 0,
  fee_asset VARCHAR(10) DEFAULT 'USDC',
  is_maker TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_symbol (symbol),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Market data (tickers) - can be cached in Redis
CREATE TABLE IF NOT EXISTS tickers (
  symbol VARCHAR(20) PRIMARY KEY,
  last_price DECIMAL(20, 8) NOT NULL,
  change_24h DECIMAL(10, 4) DEFAULT 0,
  high_24h DECIMAL(20, 8) DEFAULT 0,
  low_24h DECIMAL(20, 8) DEFAULT 0,
  volume_24h DECIMAL(30, 8) DEFAULT 0,
  quote_volume_24h DECIMAL(30, 8) DEFAULT 0,
  open_price DECIMAL(20, 8) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Funding rates (for perpetuals)
CREATE TABLE IF NOT EXISTS funding_rates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  rate DECIMAL(10, 8) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  INDEX idx_symbol_timestamp (symbol, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default trading pairs
INSERT INTO trading_pairs (symbol, base_asset, quote_asset, type, min_order_size, max_order_size, tick_size)
VALUES
  ('BTC/USDC', 'BTC', 'USDC', 'SPOT', 0.0001, 1000, 0.01),
  ('ETH/USDC', 'ETH', 'USDC', 'SPOT', 0.001, 10000, 0.01),
  ('BTC-PERP', 'BTC', 'USDC', 'PERPETUAL', 0.0001, 1000, 0.01),
  ('ETH-PERP', 'ETH', 'USDC', 'PERPETUAL', 0.001, 10000, 0.01)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert initial tickers
INSERT INTO tickers (symbol, last_price, change_24h, high_24h, low_24h, volume_24h, quote_volume_24h, open_price)
VALUES
  ('BTC/USDC', 50000.00, 2.5, 51000.00, 49000.00, 1234.5678, 61728390.00, 48780.00),
  ('ETH/USDC', 3000.00, 1.8, 3050.00, 2950.00, 5678.9012, 17036703.60, 2947.00),
  ('BTC-PERP', 50050.00, 2.4, 51050.00, 49050.00, 2345.6789, 117456345.00, 48830.00),
  ('ETH-PERP', 3005.00, 1.7, 3055.00, 2955.00, 8901.2345, 26733763.50, 2952.00)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
