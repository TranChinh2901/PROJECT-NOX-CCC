import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Unique } from "typeorm";
import { Review } from "./review";
import { User } from "@/modules/users/entity/user.entity";

@Entity('review_helpful')
@Unique('UQ_review_helpful_review_user', ['review_id', 'user_id'])
@Index('IDX_review_helpful_review_id', ['review_id'])
@Index('IDX_review_helpful_user_id', ['user_id'])
export class ReviewHelpful {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  review_id!: number;

  @ManyToOne(() => Review, review => review.helpful_votes, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'review_id', foreignKeyConstraintName: 'FK_review_helpful_review' })
  review!: Review;

  @Column()
  user_id!: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_review_helpful_user' })
  user!: User;

  @Column({ type: 'boolean' })
  is_helpful!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
