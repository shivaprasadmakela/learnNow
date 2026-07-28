-- V2__add_topic_order_index.sql
-- Add order_index column to topics table to enforce deterministic topic ordering per path
ALTER TABLE topics ADD COLUMN order_index INTEGER NOT NULL DEFAULT 1;
