import { Repository, DataSource } from "typeorm";
import { AppDataSource } from "@/config/database.config";
import { User } from "@/modules/users/entity/user.entity";
import { Order } from "@/modules/orders/entity/order";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import { PaginationQueryDto } from "@/modules/admin/dto/pagination-query.dto";
import { UpdateUserDto, BulkDeactivateDto } from "@/modules/admin/dto/admin-user.dto";
import { RoleType } from "@/modules/auth/enum/auth.enum";

export class AdminUserService {
  private userRepository: Repository<User>;
  private orderRepository: Repository<Order>;
  private dataSource: DataSource;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.orderRepository = AppDataSource.getRepository(Order);
    this.dataSource = AppDataSource;
  }

  async listUsers(query: PaginationQueryDto & { role?: RoleType }) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search = '',
      role
    } = query;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user');

    // Search filter
    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(user.fullname LIKE :search OR user.email LIKE :search OR user.phone_number LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Role filter
    if (role) {
      queryBuilder = queryBuilder.andWhere('user.role = :role', { role });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Sorting
    const validSortColumns = ['created_at', 'updated_at', 'fullname', 'email', 'role', 'is_verified'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    queryBuilder = queryBuilder.orderBy(`user.${sortColumn}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).take(limit);

    const users = await queryBuilder.getMany();

    return {
      data: users.map(user => this.formatUserResponse(user)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async getUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      throw new AppError(
        'User not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND
      );
    }

    // Get order count for this user
    const orderCount = await this.orderRepository.count({
      where: { user_id: id }
    });

    return {
      ...this.formatUserResponse(user),
      order_count: orderCount
    };
  }

  async updateUser(id: number, data: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      throw new AppError(
        'User not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND
      );
    }

    // Check email uniqueness if being updated
    if (data.email && data.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: data.email }
      });
      if (existingEmail) {
        throw new AppError(
          'Email already in use',
          HttpStatusCode.BAD_REQUEST,
          ErrorCode.EMAIL_ALREADY_EXISTS
        );
      }
    }

    // Update user
    Object.assign(user, data);
    const updatedUser = await this.userRepository.save(user);

    return this.formatUserResponse(updatedUser);
  }

  async deactivateUser(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      throw new AppError(
        'User not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND
      );
    }

    // Set is_verified to false to deactivate
    user.is_verified = false;
    await this.userRepository.save(user);
  }

  async activateUser(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      throw new AppError(
        'User not found',
        HttpStatusCode.NOT_FOUND,
        ErrorCode.USER_NOT_FOUND
      );
    }

    // Set is_verified to true to activate
    user.is_verified = true;
    await this.userRepository.save(user);
  }

  async bulkDeactivate(data: BulkDeactivateDto): Promise<{ deactivated: number }> {
    const { ids } = data;

    if (!ids || ids.length === 0) {
      throw new AppError(
        'No IDs provided',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (ids.length > 100) {
      throw new AppError(
        'Cannot deactivate more than 100 users at once',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    return this.dataSource.transaction(async manager => {
      // Verify all users exist
      const users = await manager.find(User, {
        where: ids.map(id => ({ id })),
        select: ['id']
      });

      if (users.length !== ids.length) {
        throw new AppError(
          'One or more users not found',
          HttpStatusCode.NOT_FOUND,
          ErrorCode.USER_NOT_FOUND
        );
      }

      // Deactivate all users
      for (const id of ids) {
        await manager.update(User, { id }, { is_verified: false });
      }

      return { deactivated: ids.length };
    });
  }

  private formatUserResponse(user: User) {
    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      phone_number: user.phone_number,
      address: user.address,
      avatar: user.avatar,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      is_verified: user.is_verified,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }
}

export default new AdminUserService();
