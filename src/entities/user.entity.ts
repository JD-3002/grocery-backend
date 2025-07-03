import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from "typeorm";
import * as bcrypt from "bcryptjs";
import { UserRole } from "./user-role.entity";

//Users table

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  firstName: string;

  @Column({ type: "varchar", length: 255 })
  lastName: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255, select: false })
  password: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  avatar: string | null;

  @Column({ type: "varchar", length: 255, nullable: true, select: false })
  refreshToken: string | null;

  @Column({ type: "varchar", length: 6, nullable: true, select: false })
  resetPasswordOtp: string | null;

  @Column({ type: "timestamp", nullable: true, select: false })
  resetPasswordOtpExpiry: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  // Track if password has been modified to avoid double hashing
  private passwordModified = false;

  //  hashing of passwords before saving it in database using bcrypt lib
  @BeforeInsert()
  async hashPasswordOnInsert() {
    if (this.password && !this.isPasswordHashed(this.password)) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // Hash password before update (for password reset functionality)
  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    if (this.password && !this.isPasswordHashed(this.password)) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // Helper method to check if password is already hashed
  private isPasswordHashed(password: string): boolean {
    // bcrypt hashes always start with $2a$, $2b$, or $2y$ and are 60 characters long
    return /^\$2[aby]\$\d{2}\$.{53}$/.test(password);
  }

  // function to compare to hash passwords
  async comparePassword(attempt: string): Promise<boolean> {
    return await bcrypt.compare(attempt, this.password);
  }

  // Method to set password (marks it as modified)
  setPassword(newPassword: string) {
    this.password = newPassword;
    this.passwordModified = true;
  }
}
