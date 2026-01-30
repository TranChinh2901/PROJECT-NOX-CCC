import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index, Unique } from "typeorm";
import { Review } from "./review";
import { User } from "@/modules/users/entity/user.entity";

@Entity('review_helpful')
@Unique(['review_id', 'user_id'])
@Index(['review_id'])
@Index(['user_id'])
export class ReviewHelpful {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  review_id!: number;

  @ManyToOne(() => Review, review => review.helpful_votes)
  @JoinColumn({ name: 'review_id' })
  review!: Review;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'boolean' })
  is_helpful!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}
