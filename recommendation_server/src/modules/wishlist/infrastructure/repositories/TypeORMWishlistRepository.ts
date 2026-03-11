import { Repository } from "typeorm";
import { AppDataSource } from "@/database/connect-database";
import { IWishlistRepository } from "../../domain/repositories/IWishlistRepository";
import { Wishlist } from "../../entity/wishlist.entity";
import { WishlistItem } from "../../entity/wishlist-item";
import { WishlistPriority } from "../../enum/wishlist.enum";

export class TypeORMWishlistRepository implements IWishlistRepository {
  private wishlistRepo: Repository<Wishlist>;
  private itemRepo: Repository<WishlistItem>;

  constructor() {
    this.wishlistRepo = AppDataSource.getRepository(Wishlist);
    this.itemRepo = AppDataSource.getRepository(WishlistItem);
  }

  async create(userId: number, name: string): Promise<Wishlist> {
    const wishlist = this.wishlistRepo.create({
      user_id: userId,
      name,
      is_default: false, // Default logic should be handled by service if first list
    });
    return await this.wishlistRepo.save(wishlist);
  }

  async findByUserId(userId: number): Promise<Wishlist[]> {
    return await this.wishlistRepo.find({
      where: { user_id: userId },
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images'],
      order: {
        is_default: 'DESC',
        created_at: 'DESC'
      }
    });
  }

  async findById(id: number): Promise<Wishlist | null> {
    return await this.wishlistRepo.findOne({
      where: { id },
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images']
    });
  }

  async findDefaultByUserId(userId: number): Promise<Wishlist | null> {
    return await this.wishlistRepo.findOne({
      where: { user_id: userId, is_default: true },
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images']
    });
  }

  async update(wishlist: Wishlist): Promise<Wishlist> {
    return await this.wishlistRepo.save(wishlist);
  }

  async delete(id: number): Promise<void> {
    await this.wishlistRepo.delete(id);
  }

  async addItem(wishlistId: number, variantId: number, notes?: string, priority?: WishlistPriority): Promise<WishlistItem> {
    const item = this.itemRepo.create({
      wishlist_id: wishlistId,
      variant_id: variantId,
      notes,
      priority: priority || WishlistPriority.MEDIUM,
      added_at: new Date()
    });
    const savedItem = await this.itemRepo.save(item);
    return await this.itemRepo.findOneOrFail({
      where: { id: savedItem.id },
      relations: ['variant', 'variant.product', 'variant.product.images']
    });
  }

  async removeItem(itemId: number): Promise<void> {
    await this.itemRepo.delete(itemId);
  }

  async updateItem(itemId: number, data: Partial<WishlistItem>): Promise<WishlistItem> {
    await this.itemRepo.update(itemId, data);
    return await this.itemRepo.findOneOrFail({
        where: { id: itemId },
        relations: ['variant', 'variant.product', 'variant.product.images']
    });
  }

  async findItem(wishlistId: number, variantId: number): Promise<WishlistItem | null> {
    return await this.itemRepo.findOne({
      where: { wishlist_id: wishlistId, variant_id: variantId }
    });
  }

  async findItemById(itemId: number): Promise<WishlistItem | null> {
    return await this.itemRepo.findOne({
        where: { id: itemId },
        relations: ['wishlist']
    });
  }

  async findItemByUserIdAndVariantId(userId: number, variantId: number): Promise<WishlistItem | null> {
    return await this.itemRepo
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.wishlist', 'wishlist')
      .where('wishlist.user_id = :userId', { userId })
      .andWhere('item.variant_id = :variantId', { variantId })
      .orderBy('wishlist.is_default', 'DESC')
      .addOrderBy('item.id', 'ASC')
      .getOne();
  }

  async countItems(wishlistId: number): Promise<number> {
    return await this.itemRepo.count({ where: { wishlist_id: wishlistId } });
  }
}
