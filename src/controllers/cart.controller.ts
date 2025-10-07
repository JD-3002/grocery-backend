import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Cart } from "../entities/cart.entity";
import { CartItem } from "../entities/cart-item.entity";
import { Product } from "../entities/product.entity";
import { AddToCartDto, UpdateCartItemDto } from "../dto/cart.dto";
import { validate } from "class-validator";

const cartRepository = AppDataSource.getRepository(Cart);
const cartItemRepository = AppDataSource.getRepository(CartItem);
const productRepository = AppDataSource.getRepository(Product);

export const CartController = {
  // Get user's cart
  getCart: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      const cart = await cartRepository.findOne({
        where: { userId },
        relations: ["items", "items.product"],
      });

      if (!cart) {
        const newCart = cartRepository.create({ userId, items: [] });
        await cartRepository.save(newCart);
        res.status(200).json(newCart);
      }

      res.status(200).json(cart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Add item to cart
  addToCart: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const addToCartDto: AddToCartDto = req.body;

      const errors = await validate(addToCartDto);
      if (errors.length > 0) {
        res.status(400).json({ errors });
      }

      // Find or create cart
      let cart = await cartRepository.findOne({
        where: { userId },
        relations: ["items", "items.product"],
      });

      if (!cart) {
        cart = cartRepository.create({ userId, items: [] });
        await cartRepository.save(cart);
      }

      // Check if product exists
      const product = await productRepository.findOne({
        where: { id: addToCartDto.productId },
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
      }

      // Check if product is in stock
      if (!product.inStock) {
        res.status(400).json({
          message: "Product is out of stock",
        });
      }

      // Parse quantity from string to number for validation
      const availableQuantity = parseInt(product.quantity) || 0;
      if (availableQuantity < addToCartDto.quantity) {
        res.status(400).json({
          message: "Insufficient quantity",
          availableQuantity: availableQuantity,
        });
      }

      // Parse product price from string to number
      const productPrice = parseFloat(product.price) || 0;

      // Check if item already in cart
      const existingItem = cart.items.find(
        (item) => item.productId === addToCartDto.productId
      );

      if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + addToCartDto.quantity;
        existingItem.updateQuantity(newQuantity, productPrice);
        await cartItemRepository.save(existingItem);
      } else {
        // Add new item
        const newItem = cartItemRepository.create({
          cartId: cart.id,
          productId: addToCartDto.productId,
          quantity: addToCartDto.quantity,
          price: productPrice,
          product: product,
        });
        cart.items.push(newItem);
        await cartItemRepository.save(newItem);
      }

      // Recalculate cart total
      cart.calculateTotal();
      await cartRepository.save(cart);

      //  updated cart
      const updatedCart = await cartRepository.findOne({
        where: { id: cart.id },
        relations: ["items", "items.product"],
      });

      res.status(200).json(updatedCart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const updateDto: UpdateCartItemDto = req.body;

      const errors = await validate(updateDto);
      if (errors.length > 0) {
        res.status(400).json({ errors });
      }

      // Find cart and item
      const cart = await cartRepository.findOne({
        where: { userId },
        relations: ["items", "items.product"],
      });

      if (!cart) {
        res.status(404).json({ message: "Cart not found" });
      }

      const cartItem = cart.items.find((item) => item.id === itemId);
      if (!cartItem) {
        res.status(404).json({ message: "Item not found in cart" });
      }

      if (updateDto.quantity === 0) {
        // Remove item if quantity is 0
        await cartItemRepository.delete(itemId);
        cart.items = cart.items.filter((item) => item.id !== itemId);
      } else {
        // Check product availability
        const product = await productRepository.findOne({
          where: { id: cartItem.productId },
        });

        if (product && !product.inStock) {
          res.status(400).json({
            message: "Product is out of stock",
          });
        }

        // Parse available quantity
        const availableQuantity = parseInt(product?.quantity || "0");
        if (updateDto.quantity > availableQuantity) {
          res.status(400).json({
            message: "Insufficient quantity",
            availableQuantity: availableQuantity,
          });
        }

        // Update quantity
        cartItem.updateQuantity(updateDto.quantity, cartItem.price);
        await cartItemRepository.save(cartItem);
      }

      // Recalculate cart total
      cart.calculateTotal();
      await cartRepository.save(cart);

      res.status(200).json(cart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Remove item from cart
  removeCartItem: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;

      const cart = await cartRepository.findOne({
        where: { userId },
        relations: ["items"],
      });

      if (!cart) {
        res.status(404).json({ message: "Cart not found" });
      }

      // Check if item exists in cart
      const itemExists = cart.items.some((item) => item.id === itemId);
      if (!itemExists) {
        res.status(404).json({ message: "Item not found in cart" });
      }

      // Remove item
      await cartItemRepository.delete(itemId);

      // Recalculate cart total
      cart.calculateTotal();
      await cartRepository.save(cart);

      res.status(200).json(cart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Clear entire cart
  clearCart: async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      const cart = await cartRepository.findOne({
        where: { userId },
        relations: ["items"],
      });

      if (!cart) {
        res.status(404).json({ message: "Cart not found" });
      }

      // Remove all items
      await cartItemRepository.delete({ cartId: cart.id });

      // Reset cart totals
      cart.total = 0;
      cart.itemsCount = 0;
      await cartRepository.save(cart);

      res.status(200).json(cart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
