import { PricingPlanInterval, PricingType } from "../../database/price.entity";

export class PriceDto {
    id: string;
    active?: boolean;
    description?: string;
    unit_amount?: number;
    currency?: string;
    type?: PricingType;
    interval?: PricingPlanInterval;
    interval_count?: number;
    trial_period_days?: number;
    metadata?: Record<string, any>;
    product_id: string;
}