import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { WholesaleOrderRequest } from "./wholesale-order-request.entity";

@Entity("wholesale_order_items")
export class WholesaleOrderItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(
    () => WholesaleOrderRequest,
    (request) => request.items,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "requestId" })
  request: WholesaleOrderRequest;

  @Column({ type: "uuid" })
  requestId: string;

  @Column({ type: "uuid" })
  productId: string;

  @Column({ type: "varchar" })
  productName: string;

  @Column("text", { array: true, default: [] })
  productImages: string[];

  @Column({ type: "integer" })
  requestedBoxes: number;

  @Column({ type: "varchar", nullable: true })
  boxQuantity: string | null;

  @Column({ type: "integer", nullable: true })
  unitsPerBox: number | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  boxPrice: number | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  boxDiscountPrice: number | null;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  effectivePricePerBox: number;

  @Column({ type: "integer", nullable: true })
  totalUnits: number | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total: number;

  calculateTotals(): void {
    const unitsPerBox = this.unitsPerBox ?? 0;
    this.totalUnits = unitsPerBox ? unitsPerBox * this.requestedBoxes : null;
    this.total = Number((this.effectivePricePerBox * this.requestedBoxes).toFixed(2));
  }
}

