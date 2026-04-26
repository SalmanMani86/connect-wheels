-- This script runs once when the PostgreSQL container is first created.
-- The primary database (connect_wheels) is already created via POSTGRES_DB env var.
-- We only need to create the additional databases here.

CREATE DATABASE garage;
CREATE DATABASE connect_wheels_chat;
