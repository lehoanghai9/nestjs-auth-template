import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { PriceEntity } from './price.entity';

@Entity('products')
export class ProductEntity {
   /**
    * Product ID from Stripe, e.g. prod_1234.
    * This is a primary column of type 'text'.
    */
   @PrimaryColumn('text', { unique: true })
   id: string;

   /**
    * Whether the product is currently available for purchase.
    */
   @Column('boolean', { nullable: true })
   active?: boolean;

   /**
    * The product's name, meant to be displayable to the customer.
    * Whenever this product is sold via a subscription, name will show up on associated invoice line item descriptions.
    */
   @Column('text', { nullable: true })
   name?: string;

   /**
    * The product's description, meant to be displayable to the customer.
    * Use this field to optionally store a long form explanation of the product being sold for your own rendering purposes.
    */
   @Column('text', { nullable: true })
   description?: string;

   /**
    * A URL of the product image in Stripe, meant to be displayable to the customer.
    */
   @Column('text', { nullable: true })
   image?: string;

   /**
    * Set of key-value pairs, used to store additional information about the object in a structured format.
    */
   @Column('jsonb', { nullable: true })
   metadata?: Record<string, any>;

   @OneToMany(() => PriceEntity, (price) => price.product, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
   prices?: PriceEntity[];
}
