import { WishlistService } from "../application/service/wishlist.service";
import { IWishlistRepository } from "../domain/repositories/IWishlistRepository";
import { WishlistPriority } from "../enum/wishlist.enum";
import { AppError } from "@/common/error.response";

describe("WishlistService", () => {
  let service: WishlistService;
  let mockRepo: jest.Mocked<IWishlistRepository>;

  const mockUser = { id: 1 } as any;
  const mockWishlist = {
      id: 1,
      user_id: 1,
      name: "My Wishlist",
      is_default: true,
      items: []
  } as any;
  const mockItem = {
      id: 1,
      wishlist_id: 1,
      variant_id: 100,
      priority: WishlistPriority.MEDIUM,
      wishlist: mockWishlist
  } as any;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findDefaultByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateItem: jest.fn(),
      findItem: jest.fn(),
      findItemById: jest.fn(),
      countItems: jest.fn(),
    };
    service = new WishlistService(mockRepo);
  });

  describe("list", () => {
    it("should return user wishlists", async () => {
      mockRepo.findByUserId.mockResolvedValue([mockWishlist]);
      const result = await service.list(1);
      expect(result).toEqual([mockWishlist]);
      expect(mockRepo.findByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe("add", () => {
    it("should add item to default wishlist if no wishlistId provided", async () => {
      mockRepo.findDefaultByUserId.mockResolvedValue(mockWishlist);
      mockRepo.findItem.mockResolvedValue(null);
      mockRepo.addItem.mockResolvedValue(mockItem);

      const result = await service.add(1, 100);

      expect(mockRepo.findDefaultByUserId).toHaveBeenCalledWith(1);
      expect(mockRepo.addItem).toHaveBeenCalledWith(1, 100, undefined, undefined);
      expect(result).toEqual(mockItem);
    });

    it("should create default wishlist if none exists", async () => {
      mockRepo.findDefaultByUserId.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockWishlist);
      mockRepo.findItem.mockResolvedValue(null);
      mockRepo.addItem.mockResolvedValue(mockItem);

      await service.add(1, 100);

      expect(mockRepo.create).toHaveBeenCalledWith(1, "My Wishlist");
      expect(mockRepo.update).toHaveBeenCalled(); // setting is_default
    });

    it("should throw if item already exists", async () => {
      mockRepo.findDefaultByUserId.mockResolvedValue(mockWishlist);
      mockRepo.findItem.mockResolvedValue(mockItem);

      await expect(service.add(1, 100)).rejects.toThrow(AppError);
    });
  });

  describe("updateItem", () => {
      it("should update item if owned by user", async () => {
          mockRepo.findItemById.mockResolvedValue(mockItem);
          mockRepo.updateItem.mockResolvedValue({ ...mockItem, notes: "Updated" });

          const result = await service.updateItem(1, 1, { notes: "Updated" });
          expect(result.notes).toBe("Updated");
      });

      it("should throw if item not found", async () => {
          mockRepo.findItemById.mockResolvedValue(null);
          await expect(service.updateItem(1, 99, {})).rejects.toThrow("Wishlist item not found");
      });

      it("should throw if item belongs to another user", async () => {
          const otherItem = { ...mockItem, wishlist: { user_id: 2 } };
          mockRepo.findItemById.mockResolvedValue(otherItem);
          await expect(service.updateItem(1, 1, {})).rejects.toThrow("Access denied");
      });
  });

  describe("removeItem", () => {
      it("should remove item", async () => {
          mockRepo.findItemById.mockResolvedValue(mockItem);
          await service.removeItem(1, 1);
          expect(mockRepo.removeItem).toHaveBeenCalledWith(1);
      });
  });

  describe("check", () => {
      it("should return true if item in wishlist", async () => {
          const listWithItem = { ...mockWishlist, items: [mockItem] };
          mockRepo.findByUserId.mockResolvedValue([listWithItem]);

          const result = await service.check(1, 100);
          expect(result.in_wishlist).toBe(true);
          expect(result.wishlist_id).toBe(1);
      });

      it("should return false if item not in wishlist", async () => {
          mockRepo.findByUserId.mockResolvedValue([mockWishlist]);
          const result = await service.check(1, 999);
          expect(result.in_wishlist).toBe(false);
      });
  });
});
