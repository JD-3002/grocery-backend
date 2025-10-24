import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Product } from "../entities/product.entity";
import { CreateProductDto, UpdateProductDto } from "../dto/product.dto";
import { validate } from "class-validator";
import { In } from "typeorm";
import { Category } from "../entities/category.entity";

const productRepository = AppDataSource.getRepository(Product);
const categoryRepository = AppDataSource.getRepository(Category);

export const ProductController = {
  // Create Product (Admin only) or Users with access
  createProduct: async (req: Request, res: Response) => {
    try {
      // Create and validate DTO
      const productData = new CreateProductDto();
      Object.assign(productData, req.body);

      const errors = await validate(productData);
      if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
      }

      // Validate categories
      const categories = await categoryRepository.find({
        where: { id: In(productData.categoryIds) },
      });

      if (categories.length !== productData.categoryIds.length) {
        res.status(400).json({
          message: "One or more category IDs are invalid",
          invalidIds: productData.categoryIds.filter(
            (id) => !categories.some((c) => c.id === id)
          ),
        });
        return;
      }

      // Create and save product
      const product = productRepository.create({
        title: productData.title,
        images: productData.images,
        price: productData.price,
        boxPrice: productData.boxPrice || null,
        boxDiscountPrice: productData.boxDiscountPrice || null,
        summary: productData.summary,
        quantity: productData.quantity || "0",
        boxQuantity: productData.boxQuantity || null,
        inStock: productData.inStock ?? true,
        isActive: productData.isActive ?? true,
        categories,
      });

      await productRepository.save(product);

      // Return the created product with relations
      const createdProduct = await productRepository.findOne({
        where: { id: product.id },
        relations: ["categories"],
      });

      res.status(201).json(createdProduct);
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  // Get All Products (Public)

  getProducts: async (req: Request, res: Response) => {
    try {
      const { category, active } = req.query;

      // 1. First get the product IDs that match our filters
      const productIdsQuery = productRepository
        .createQueryBuilder("product")
        .select("product.id", "id");

      if (category) {
        productIdsQuery
          .innerJoin("product.categories", "category")
          .andWhere("category.id = :categoryId", { categoryId: category });
      }

      if (active === "true") {
        productIdsQuery.andWhere("product.isActive = :isActive", {
          isActive: true,
        });
      }

      const productIds = (await productIdsQuery.getRawMany()).map((p) => p.id);

      // 2. If no products found, return empty array
      if (productIds.length === 0) {
        res.status(200).json([]);
        return;
      }

      // 3. Get complete product data with category IDs
      const products = await productRepository
        .createQueryBuilder("product")
        .leftJoinAndSelect("product.categories", "category")
        .where("product.id IN (:...productIds)", { productIds })
        .getMany();

      // 4. Transform response to include only categoryIds
      const response = products.map((product) => {
        const { categories, ...productData } = product;
        return {
          ...productData,
          categoryIds: categories.map((c) => c.id),
        };
      });

      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  //Get Single Product (Public) by category slug
  getProductById: async (req: Request, res: Response) => {
    try {
      const product = await productRepository.findOne({
        where: { id: req.params.id },
        relations: ["categories"],
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      // Create a new object without the categories property
      const { categories, ...productData } = product;
      const response = {
        ...productData,
        categoryIds: categories.map((c) => c.id),
      };
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  //Update product (Admin only)
  updateProduct: async (req: Request, res: Response) => {
    try {
      const product = await productRepository.findOne({
        where: { id: req.params.id },
        relations: ["categories"], // This ensures categories are loaded
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      const updateData = new UpdateProductDto();
      Object.assign(updateData, req.body);

      const errors = await validate(updateData);
      if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
      }

      // Update categories if provided
      if (updateData.categoryIds) {
        // Find categories with proper typing
        const categories = (await categoryRepository.find({
          where: { id: In(updateData.categoryIds) },
        })) as Category[]; // Explicit type assertion

        if (categories.length !== updateData.categoryIds.length) {
          res
            .status(400)
            .json({ message: "One or more category IDs are invalid" });
          return;
        }

        // Clear existing categories and set new ones
        product.categories = categories;
      }

      // Update other fields (excluding categories which we handled above)
      const { categoryIds, ...rest } = updateData;
      Object.assign(product, rest);

      await productRepository.save(product);

      // Return the updated product with categories
      const updatedProduct = await productRepository.findOne({
        where: { id: product.id },
        relations: ["categories"],
      });

      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  //Delete Product (Admin only)
  deleteProduct: async (req: Request, res: Response) => {
    try {
      const product = await productRepository.findOne({
        where: { id: req.params.id },
      });
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      await productRepository.remove(product);
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Sever Error" });
    }
  },

  // Upload Product Image (Admin only)
  //under work
  // uploadImage: async (req: Request, res: Response) => {
  //   try {
  //     if (!req.file) {
  //       return res.status(400).json({ message: "No file uploaded" });
  //     }

  //     // In production, you would upload to S3/Cloudinary/etc.
  //     const imagePath = `/uploads/${req.file.filename}`;

  //     return res.status(200).json({
  //       message: "Image uploaded successfully",
  //       imagePath,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({ message: "Internal server error" });
  //   }
  // },

  getProductsByCategory: async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const { limit = "10", page = "1" } = req.query;

      const take = parseInt(limit as string);
      const skip = (parseInt(page as string) - 1) * take;

      const category = await categoryRepository.findOne({
        where: { slug },
      });

      if (!category) {
        res.status(404).json({ message: "Category not found" });
      }

      const [products, total] = await productRepository.findAndCount({
        where: {
          categories: { id: category.id },
          isActive: true,
        },
        relations: ["categories"],
        take,
        skip,
        order: { createdAt: "DESC" },
      });

      res.status(200).json({
        data: products,
        meta: {
          total,
          page: parseInt(page as string),
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
