import { Response, NextFunction } from "express";
import { WishlistService } from "../../application/service/wishlist.service";
import { TypeORMWishlistRepository } from "../../infrastructure/repositories/TypeORMWishlistRepository";
import { AppResponse } from "@/common/success.response";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";

export class WishlistController {
  private service: WishlistService;

  constructor() {
    this.service = new WishlistService(new TypeORMWishlistRepository());
  }

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const result = await this.service.list(userId);
      new AppResponse({
        message: "Wishlist retrieved successfully",
        data: result
      }).sendResponse(res);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { name } = req.body;
        const result = await this.service.create(userId, name);
        new AppResponse({
            message: "Wishlist created successfully",
            statusCode: 201,
            data: result
        }).sendResponse(res);
    } catch (error) {
        next(error);
    }
  }

  get = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
          const userId = req.user!.id;
          const { id } = req.params;
          const result = await this.service.get(userId, Number(id));
          new AppResponse({
            message: "Wishlist retrieved successfully",
            data: result
          }).sendResponse(res);
      } catch (error) {
          next(error);
      }
  }

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
          const userId = req.user!.id;
          const { id } = req.params;
          await this.service.delete(userId, Number(id));
          new AppResponse({
            message: "Wishlist deleted successfully",
            statusCode: 204,
            data: null
          }).sendResponse(res);
      } catch (error) {
          next(error);
      }
  }

  add = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { variant_id, notes, priority, wishlist_id } = req.body;
      const result = await this.service.add(userId, variant_id, notes, priority, wishlist_id);
      new AppResponse({
        message: "Item added to wishlist successfully",
        statusCode: 201,
        data: result
      }).sendResponse(res);
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const data = req.body;
      const result = await this.service.updateItem(userId, Number(id), data);
      new AppResponse({
        message: "Wishlist item updated successfully",
        data: result
      }).sendResponse(res);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await this.service.removeItem(userId, Number(id));
      new AppResponse({
        message: "Item removed from wishlist successfully",
        statusCode: 204,
        data: null
      }).sendResponse(res);
    } catch (error) {
      next(error);
    }
  };

  check = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { variantId } = req.params;
      const result = await this.service.check(userId, Number(variantId));
      new AppResponse({
        message: "Check successful",
        data: result
      }).sendResponse(res);
    } catch (error) {
      next(error);
    }
  };
}
