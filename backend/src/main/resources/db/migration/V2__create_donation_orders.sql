-- Create donation_orders table
CREATE TABLE IF NOT EXISTS donation_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(100) UNIQUE NOT NULL,
    payment_id VARCHAR(100),
    signature VARCHAR(255),
    amount INTEGER NOT NULL, -- Amount in Rupees
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED', -- CREATED, COMPLETED, FAILED
    donor_name VARCHAR(255),
    donor_email VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_donation_orders_order_id ON donation_orders(order_id);
