import { Repository, IsNull } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Category } from "@/modules/products/entity/category";
import { Product } from "@/modules/products/entity/product";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";

export class CategoryService {
  private categoryRepository: Repository<Category>;
  private productRepository: Repository<Product>;

  constructor() {
    this.categoryRepository = AppDataSource.getRepository(Category);
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async getAllCategories() {
    const categories = await this.categoryRepository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', name: 'ASC' }
    });

    const buildTree = (parentId: number | null = null): any[] => {
      return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image_url: cat.image_url,
          sort_order: cat.sort_order,
          is_active: cat.is_active,
          children: buildTree(cat.id)
        }));
    };

    return buildTree();
  }

   async getCategoryById(id: number) {
     const category = await this.categoryRepository.findOne({
       where: { id, is_active: true }
     });

     if (!category) {
       throw new AppError(
         'Category not found',
         HttpStatusCode.NOT_FOUND,
         ErrorCode.CATEGORY_NOT_FOUND
       );
     }

    const children = await this.categoryRepository.find({
      where: { parent_id: id, is_active: true }
    });

    const productCount = await this.productRepository.count({
      where: { category_id: id, is_active: true }
    });

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image_url: category.image_url,
      sort_order: category.sort_order,
      parent_id: category.parent_id,
      children: children.map(child => ({
        id: child.id,
        name: child.name,
        slug: child.slug
      })),
      product_count: productCount
    };
  }

   async getCategoryBySlug(slug: string) {
     const category = await this.categoryRepository.findOne({
       where: { slug, is_active: true }
     });

     if (!category) {
       throw new AppError(
         'Category not found',
         HttpStatusCode.NOT_FOUND,
         ErrorCode.CATEGORY_NOT_FOUND
       );
     }

    return this.getCategoryById(category.id);
  }

   async getRootCategories() {
     const categories = await this.categoryRepository.find({
       where: { parent_id: IsNull(), is_active: true },
       order: { sort_order: 'ASC', name: 'ASC' }
     });

    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image_url: cat.image_url,
      sort_order: cat.sort_order
    }));
  }

  async getCategoryTree() {
    const allCategories = await this.categoryRepository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' }
    });

    const buildTree = (parentId: number | null): any[] => {
      const children = allCategories.filter(cat => cat.parent_id === parentId);
      return children.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image_url: cat.image_url,
        sort_order: cat.sort_order,
        children: buildTree(cat.id)
      }));
    };

    return buildTree(null);
  }
}

export default new CategoryService();
