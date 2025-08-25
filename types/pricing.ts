export interface PricingBreakdown {
  totalNights: number;
  weekdayNights: number;
  weekendNights: number;
  basePrice: number;
  weekdayDiscount: number;
  finalPrice: number;
  hasDiscount: boolean;
  pricePerNight: number;
}

export interface PricingDisplayProps {
  breakdown: PricingBreakdown;
  showDetailed?: boolean;
}
