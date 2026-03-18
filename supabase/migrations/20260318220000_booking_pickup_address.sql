-- Add pickup_address column to booking_requests
-- Stores the pickup/dropoff address when transport = 'need-pickup'
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS pickup_address text;
