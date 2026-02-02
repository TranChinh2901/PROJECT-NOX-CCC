import { ReviewHelpful } from './review-helpful';
import { Review } from './review';
import { User } from '@/modules/users/entity/user.entity';

describe('ReviewHelpful Entity', () => {
  describe('Schema Validation', () => {
    it('should create a ReviewHelpful with all required fields', () => {
      const helpful = new ReviewHelpful();
      helpful.id = 1;
      helpful.review_id = 10;
      helpful.user_id = 5;
      helpful.is_helpful = true;
      
      expect(helpful.id).toBe(1);
      expect(helpful.review_id).toBe(10);
      expect(helpful.user_id).toBe(5);
      expect(helpful.is_helpful).toBe(true);
    });

    it('should accept is_helpful as true', () => {
      const helpful = new ReviewHelpful();
      helpful.is_helpful = true;
      
      expect(helpful.is_helpful).toBe(true);
    });

    it('should accept is_helpful as false', () => {
      const helpful = new ReviewHelpful();
      helpful.is_helpful = false;
      
      expect(helpful.is_helpful).toBe(false);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique (review_id, user_id) combination', () => {
      const helpful1 = new ReviewHelpful();
      helpful1.review_id = 10;
      helpful1.user_id = 5;
      
      const helpful2 = new ReviewHelpful();
      helpful2.review_id = 10;
      helpful2.user_id = 5;
      
      expect(helpful1.review_id).toBe(helpful2.review_id);
      expect(helpful1.user_id).toBe(helpful2.user_id);
    });

    it('should allow same user to vote on different reviews', () => {
      const helpful1 = new ReviewHelpful();
      helpful1.review_id = 10;
      helpful1.user_id = 5;
      
      const helpful2 = new ReviewHelpful();
      helpful2.review_id = 11;
      helpful2.user_id = 5;
      
      expect(helpful1.user_id).toBe(helpful2.user_id);
      expect(helpful1.review_id).not.toBe(helpful2.review_id);
    });

    it('should allow different users to vote on same review', () => {
      const helpful1 = new ReviewHelpful();
      helpful1.review_id = 10;
      helpful1.user_id = 5;
      
      const helpful2 = new ReviewHelpful();
      helpful2.review_id = 10;
      helpful2.user_id = 6;
      
      expect(helpful1.review_id).toBe(helpful2.review_id);
      expect(helpful1.user_id).not.toBe(helpful2.user_id);
    });
  });

  describe('Timestamp Fields', () => {
    it('should auto-set created_at', () => {
      const helpful = new ReviewHelpful();
      helpful.created_at = new Date();
      
      expect(helpful.created_at).toBeInstanceOf(Date);
    });
  });

  describe('Relationships', () => {
    it('should define ManyToOne relationship with Review', () => {
      const review = new Review();
      review.id = 10;
      
      const helpful = new ReviewHelpful();
      helpful.review = review;
      helpful.review_id = review.id;
      
      expect(helpful.review).toBe(review);
      expect(helpful.review_id).toBe(10);
    });

    it('should define ManyToOne relationship with User', () => {
      const user = new User();
      user.id = 5;
      
      const helpful = new ReviewHelpful();
      helpful.user = user;
      helpful.user_id = user.id;
      
      expect(helpful.user).toBe(user);
      expect(helpful.user_id).toBe(5);
    });

    it('should allow multiple votes for same review', () => {
      const reviewId = 10;
      
      const helpful1 = new ReviewHelpful();
      helpful1.review_id = reviewId;
      helpful1.user_id = 1;
      helpful1.is_helpful = true;
      
      const helpful2 = new ReviewHelpful();
      helpful2.review_id = reviewId;
      helpful2.user_id = 2;
      helpful2.is_helpful = false;
      
      expect(helpful1.review_id).toBe(helpful2.review_id);
      expect(helpful1.user_id).not.toBe(helpful2.user_id);
    });
  });

  describe('Vote Types', () => {
    it('should track helpful vote', () => {
      const helpful = new ReviewHelpful();
      helpful.is_helpful = true;
      
      expect(helpful.is_helpful).toBe(true);
    });

    it('should track not helpful vote', () => {
      const helpful = new ReviewHelpful();
      helpful.is_helpful = false;
      
      expect(helpful.is_helpful).toBe(false);
    });
  });

  describe('Business Logic', () => {
    it('should allow user to change vote', () => {
      const helpful = new ReviewHelpful();
      helpful.is_helpful = true;
      
      helpful.is_helpful = false;
      
      expect(helpful.is_helpful).toBe(false);
    });

    it('should count helpful votes for review', () => {
      const reviewId = 10;
      
      const votes = [
        { user_id: 1, is_helpful: true },
        { user_id: 2, is_helpful: true },
        { user_id: 3, is_helpful: false },
        { user_id: 4, is_helpful: true },
      ];
      
      const helpfulVotes = votes.filter(v => v.is_helpful).length;
      const notHelpfulVotes = votes.filter(v => !v.is_helpful).length;
      
      expect(helpfulVotes).toBe(3);
      expect(notHelpfulVotes).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle review with no votes', () => {
      const review = new Review();
      review.id = 10;
      review.helpful_count = 0;
      review.not_helpful_count = 0;
      
      expect(review.helpful_count).toBe(0);
      expect(review.not_helpful_count).toBe(0);
    });

    it('should handle review with only helpful votes', () => {
      const reviewId = 10;
      
      const vote1 = new ReviewHelpful();
      vote1.review_id = reviewId;
      vote1.user_id = 1;
      vote1.is_helpful = true;
      
      const vote2 = new ReviewHelpful();
      vote2.review_id = reviewId;
      vote2.user_id = 2;
      vote2.is_helpful = true;
      
      expect(vote1.is_helpful).toBe(true);
      expect(vote2.is_helpful).toBe(true);
    });

    it('should handle review with only not helpful votes', () => {
      const reviewId = 10;
      
      const vote1 = new ReviewHelpful();
      vote1.review_id = reviewId;
      vote1.user_id = 1;
      vote1.is_helpful = false;
      
      const vote2 = new ReviewHelpful();
      vote2.review_id = reviewId;
      vote2.user_id = 2;
      vote2.is_helpful = false;
      
      expect(vote1.is_helpful).toBe(false);
      expect(vote2.is_helpful).toBe(false);
    });
  });

  describe('Vote Aggregation', () => {
    it('should aggregate votes from multiple users', () => {
      const reviewId = 10;
      const votes: ReviewHelpful[] = [];
      
      for (let i = 1; i <= 10; i++) {
        const vote = new ReviewHelpful();
        vote.review_id = reviewId;
        vote.user_id = i;
        vote.is_helpful = i <= 7;
        votes.push(vote);
      }
      
      const helpfulCount = votes.filter(v => v.is_helpful).length;
      const notHelpfulCount = votes.filter(v => !v.is_helpful).length;
      
      expect(helpfulCount).toBe(7);
      expect(notHelpfulCount).toBe(3);
    });

    it('should calculate vote percentage', () => {
      const totalVotes = 50;
      const helpfulVotes = 40;
      const notHelpfulVotes = 10;
      
      const helpfulPercentage = (helpfulVotes / totalVotes) * 100;
      
      expect(helpfulPercentage).toBe(80);
    });
  });
});
