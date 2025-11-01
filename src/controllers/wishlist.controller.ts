import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Wishlist } from "../entities/wishlist.entity";
import { WishlistItem } from "../entities/wishlist-item.entity";
import { Product } from "../entities/product.entity";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { AddToWishlistDto } from "../dto/wishlist.dto";

const wishlistRepository = AppDataSource.getRepository(Wishlist);
const wishlistItemRepository = AppDataSource.getRepository(WishlistItem);
const productRepository = AppDataSource.getRepository(Product);

export const WishlistController = {
  // Get user's wishlist
  getWishlist: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      let wishlist = await wishlistRepository.findOne({
        where: { userId },
        relations: ["items", "items.product"],
      });

      if (!wishlist) {
        wishlist = wishlistRepository.create({ userId, items: [] });
        await wishlistRepository.save(wishlist);
      }

      res.status(200).json(wishlist);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Add a product to wishlist (no duplicates)
  addItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const dto = plainToInstance(AddToWishlistDto, req.body);

      const errors = await validate(dto, {
        whitelist: true,
        forbidUnknownValues: true,
        validationError: { target: false },
      });
      if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
      }

      // Find or create wishlist
      let wishlist = await wishlistRepository.findOne({
        where: { userId },
        relations: ["items", "items.product"],
      });

      if (!wishlist) {
        wishlist = wishlistRepository.create({ userId, items: [] });
        await wishlistRepository.save(wishlist);
      }

      // Check product exists
      const product = await productRepository.findOne({
        where: { id: dto.productId },
      });
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      // Prevent duplicates
      const exists = wishlist.items?.some((i) => i.productId === dto.productId);
      if (exists) {
        res.status(200).json(wishlist);
        return;
      }

      const newItem = wishlistItemRepository.create({
        wishlistId: wishlist.id,
        productId: dto.productId,
        product,
      });
      await wishlistItemRepository.save(newItem);

      // Return updated wishlist
      const updated = await wishlistRepository.findOne({
        where: { id: wishlist.id },
        relations: ["items", "items.product"],
      });

      res.status(200).json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Remove an item from wishlist
  removeItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;

      const wishlist = await wishlistRepository.findOne({
        where: { userId },
        relations: ["items"],
      });

      if (!wishlist) {
        res.status(404).json({ message: "Wishlist not found" });
        return;
      }

      const itemExists = wishlist.items?.some((i) => i.id === itemId);
      if (!itemExists) {
        res.status(404).json({ message: "Item not found in wishlist" });
        return;
      }

      await wishlistItemRepository.delete(itemId);

      const updated = await wishlistRepository.findOne({
        where: { id: wishlist.id },
        relations: ["items", "items.product"],
      });

      res.status(200).json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Clear wishlist
  clearWishlist: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      const wishlist = await wishlistRepository.findOne({
        where: { userId },
        relations: ["items"],
      });

      if (!wishlist) {
        res.status(404).json({ message: "Wishlist not found" });
        return;
      }

      await wishlistItemRepository.delete({ wishlistId: wishlist.id });

      const updated = await wishlistRepository.findOne({
        where: { id: wishlist.id },
        relations: ["items", "items.product"],
      });

      res.status(200).json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

