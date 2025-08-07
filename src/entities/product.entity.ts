import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Category } from "./category.entity";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column("text", { array: true, default: [] })
  images: string[];

  @Column({ type: "varchar" })
  price: string; // Changed from decimal to varchar

  @Column({ type: "varchar", nullable: true })
  boxPrice: string | null; // New field

  @Column({ type: "varchar", nullable: true })
  boxDiscountPrice: string | null; // Replaced discountedPrice

  @Column({ type: "text" })
  summary: string;

  @Column({ type: "varchar", default: "0" })
  quantity: string; // Replaced stock

  @Column({ type: "varchar", nullable: true })
  boxQuantity: string | null; // New field

  @Column({ type: "boolean", default: true })
  inStock: boolean; // New field replacing stock boolean concept

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @ManyToMany(() => Category, (category) => category.products)
  @JoinTable({
    name: "product_categories",
    joinColumn: {
      name: "productId",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "categoryId",
      referencedColumnName: "id",
    },
  })
  categories: Category[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
