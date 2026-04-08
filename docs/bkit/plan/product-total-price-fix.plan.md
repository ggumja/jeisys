# Plan: Product Total Price Calculation Fix

## Purpose
Fix the "Total Price" (총 금액) at the bottom of the product detail page to correctly reflect set-option discounts.

## Scope
- `ProductDetailPage.tsx` logic update.

## Requirements
- Prioritize set option discounts over tier pricing.
- Correctly apply subscription discounts on the final effective unit price.

## Success Criteria
- Total price matches the selected option's discounted price.
