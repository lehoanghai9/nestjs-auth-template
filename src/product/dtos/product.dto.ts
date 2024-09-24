
export interface ProductDto {
    id: string;
    name: string;
    description?: string;
    active: boolean;
    images: string[];
    metadata?: Record<string, any>;
}