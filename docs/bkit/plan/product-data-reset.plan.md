# Plan: Product Data Reset for Testing

## Purpose
Clear all existing product and transaction data to test product creation from scratch.

## Scope
- Database tables for products, orders, shipments, carts.

## Requirements
- Maintain Referential Integrity (Delete child tables before parents).
- Provide a single consolidated SQL script for the user.

## Success Criteria
- All 13 listed tables are empty (count = 0).
