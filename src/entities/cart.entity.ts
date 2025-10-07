import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./user.entity";
import { CartItem } from "./cart-item.entity";

@Entity("carts")
export class Cart {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "uuid" })
  userId: string;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, { cascade: true })
  items: CartItem[];

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: "integer", default: 0 })
  itemsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // In Cart entity
  calculateTotal(): void {
    this.total = this.items.reduce((sum, item) => {
      // Ensure numeric calculation even if prices are stored as numbers
      return sum + item.price * item.quantity;
    }, 0);

    this.itemsCount = this.items.reduce(
      (count, item) => count + item.quantity,
      0
    );
  }
}
