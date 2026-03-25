import { Repository, IsNull } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { Category } from "@/modules/products/entity/category";
import { Product } from "@/modules/products/entity/product";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import { PaginationQueryDto } from "@/modules/admin/dto/pagination-query.dto";
import { CreateCategoryDto, UpdateCategoryDto } from "@/modules/admin/dto/admin-category.dto";

export class AdminCategoryService {
  private categoryRepository: Repository<Category>;
  private productRepository: Repository<Product>;

  constructor() {
    this.categoryRepository = AppDataSource.getRepository(Category);
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async listCategories(query: PaginationQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search = ''
    } = query;

    let queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .withDeleted();

    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(category.name LIKE :search OR category.description LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const total = await queryBuilder.getCount();

    const validSortColumns = ['created_at', 'updated_at', 'name', 'sort_order'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    queryBuilder = queryBuilder.orderBy(`category.${sortColumn}`, sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    const categories = await queryBuilder.getMany();

    return {
      data: categories.map(category => this.formatCategoryResponse(category)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async getCategory(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
      withDeleted: true
    });

    if (!category) {
      throw new AppError(
        'Category not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.CATEGORY_NOT_FOUND
      );
    }

    return this.formatCategoryResponse(category, true);
  }

  async createCategory(data: CreateCategoryDto) {
    // Validate parent exists if provided
    if (data.parent_id) {
      const parent = await this.categoryRepository.findOne({
        where: { id: data.parent_id, deleted_at: IsNull() }
      });
      if (!parent) {
        throw new AppError(
          'Parent category not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.CATEGORY_NOT_FOUND
        );
      }
    }

    // Check name uniqueness
    const existingName = await this.categoryRepository.findOne({
      where: { name: data.name }
    });
    if (existingName) {
      throw new AppError(
        'Category name already exists',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.DUPLICATE_ENTRY
      );
    }

    // Check slug uniqueness
    const existingSlug = await this.categoryRepository.findOne({
      where: { slug: data.slug }
    });
    if (existingSlug) {
      throw new AppError(
        'Category slug already exists',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.DUPLICATE_ENTRY
      );
    }

    const category = this.categoryRepository.create(data);
    const savedCategory = await this.categoryRepository.save(category);

    return this.formatCategoryResponse(savedCategory);
  }

  async updateCategory(id: number, data: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: { id }
    });

    if (!category) {
      throw new AppError(
        'Category not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.CATEGORY_NOT_FOUND
      );
    }

    // Validate parent_id if being updated
    if (data.parent_id !== undefined) {
      // Cannot set self as parent
      if (data.parent_id === id) {
        throw new AppError(
          'Category cannot be its own parent',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // Cannot create circular reference (parent cannot be a descendant)
      if (data.parent_id !== null) {
        const isDescendant = await this.isDescendantOf(data.parent_id, id);
        if (isDescendant) {
          throw new AppError(
            'Circular reference: parent cannot be a descendant of this category',
            HttpStatusCode.BAD_REQUEST,
            ErrorCode.VALIDATION_ERROR
          );
        }

        // Verify parent exists
        const parent = await this.categoryRepository.findOne({
          where: { id: data.parent_id, deleted_at: IsNull() }
        });
        if (!parent) {
          throw new AppError(
            'Parent category not found',
            HttpStatusCode.NOT_FOUND,
            ErrorCode.CATEGORY_NOT_FOUND
          );
        }
      }
    }

    // Check name uniqueness if being updated
    if (data.name && data.name !== category.name) {
      const existingName = await this.categoryRepository.findOne({
        where: { name: data.name }
      });
      if (existingName) {
        throw new AppError(
          'Category name already exists',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.DUPLICATE_ENTRY
        );
      }
    }

    // Check slug uniqueness if being updated
    if (data.slug && data.slug !== category.slug) {
      const existingSlug = await this.categoryRepository.findOne({
        where: { slug: data.slug }
      });
      if (existingSlug) {
        throw new AppError(
          'Category slug already exists',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.DUPLICATE_ENTRY
        );
      }
    }

    Object.assign(category, data);
    const updatedCategory = await this.categoryRepository.save(category);

    return this.formatCategoryResponse(updatedCategory);
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id }
    });

    if (!category) {
      throw new AppError(
        'Category not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.CATEGORY_NOT_FOUND
      );
    }

    // Check for children
    const childCount = await this.categoryRepository.count({
      where: { parent_id: id, deleted_at: IsNull() }
    });
    if (childCount > 0) {
      throw new AppError(
        'Cannot delete category with children',
        HttpStatusCode.CONFLICT,
        ErrorCode.CATEGORY_IN_USE
      );
    }

    // Check for active products
    const productCount = await this.productRepository.count({
      where: { category_id: id, deleted_at: IsNull() }
    });
    if (productCount > 0) {
      throw new AppError(
        'Cannot delete category with active products',
        HttpStatusCode.CONFLICT,
        ErrorCode.CATEGORY_IN_USE
      );
    }

    await this.categoryRepository.softDelete(id);
  }

  async getCategoryTree() {
    // Get all active categories
    const categories = await this.categoryRepository.find({
      where: { deleted_at: IsNull() },
      order: { sort_order: 'ASC', name: 'ASC' }
    });

    // Build tree structure
    const categoryMap = new Map<number, any>();
    const rootCategories: any[] = [];

    // First pass: create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...this.formatCategoryResponse(category),
        children: []
      });
    });

    // Second pass: build tree
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id);
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id);
        parent.children.push(categoryNode);
      } else {
        rootCategories.push(categoryNode);
      }
    });

    return rootCategories;
  }

  // Helper: Check if potentialDescendant is a descendant of ancestorId
  private async isDescendantOf(potentialDescendantId: number, ancestorId: number): Promise<boolean> {
    let currentId: number | null = potentialDescendantId;
    const visited = new Set<number>();

    while (currentId !== null) {
      if (currentId === ancestorId) return true;
      if (visited.has(currentId)) return false; // Safety: prevent infinite loop
      visited.add(currentId);

      const parent = await this.categoryRepository.findOne({
        where: { id: currentId }
      });
      currentId = parent?.parent_id ?? null;
    }
    return false;
  }

  private formatCategoryResponse(category: Category, includeChildren: boolean = false) {
    const response: any = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parent_id: category.parent_id,
      parent: category.parent ? {
        id: category.parent.id,
        name: category.parent.name,
        slug: category.parent.slug
      } : null,
      image_url: category.image_url,
      sort_order: category.sort_order,
      is_active: category.is_active,
      deleted_at: category.deleted_at,
      created_at: category.created_at,
      updated_at: category.updated_at
    };

    if (includeChildren && category.children) {
      response.children = category.children.map(child => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        sort_order: child.sort_order,
        is_active: child.is_active
      }));
    }

    return response;
  }
}

export default new AdminCategoryService();
