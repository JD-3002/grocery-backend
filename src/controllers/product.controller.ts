import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Product } from "../entities/product.entity";
import { CreateProductDto, UpdateProductDto } from "../dto/product.dto";
import { validate } from "class-validator";
import { In, QueryBuilder } from "typeorm";
import { Category } from "../entities/category.entity";

const productRepository = AppDataSource.getRepository(Product);
const categoryRepository = AppDataSource.getRepository(Category);

export const ProductController = {
  // Create Product (Admin only) or Users with access
  createProduct: async (req: Request, res: Response) => {
    try {
      const productData = new CreateProductDto();
      Object.assign(productData, req.body);

      const errors = await validate(productData);
      if (errors.length > 0) {
        res.status(400).json({ errors });
      }

      // Find all categories
      const categories = await categoryRepository.find({
        where: { id: In(productData.categoryIds) },
      });

      if (categories.length !== productData.categoryIds.length) {
        res
          .status(400)
          .json({ message: "One or more category IDs are invalid" });
      }

      const product = productRepository.create({
        ...productData,
        categories,
      });

      await productRepository.save(product);
      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  //Get All Products(Public = available to all)
  getProducts: async (req: Request, res: Response) => {
    try {
      const { category, active } = req.query;
      const query = productRepository.createQueryBuilder("product");

      if (category) {
        query.where("product.category= :category", { category });
      }

      if (active === "true") {
        query.andWhere("product.isActive = :isActive", { isActive: true });
      }

      const product = await query.getMany();
      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Sever Error" });
    }
  },

  //Get Single Product (Public)
  getProductById: async (req: Request, res: Response) => {
    try {
      const product = await productRepository.findOne({
        where: { id: req.params.id },
      });
      if (!product) {
        res.status(400).json({ message: "Product not found" });
      }
      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Sever Error" });
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
      }

      const updateData = new UpdateProductDto();
      Object.assign(updateData, req.body);

      const errors = await validate(updateData);
      if (errors.length > 0) {
        res.status(400).json({ errors });
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
        res.status(500).json({ messsage: "No such product exist" });
      }

      await productRepository.remove(product);
      res.status(201).json({ message: "Product Deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Sever Error" });
    }
  },

  // Upload Product Image (Admin only)
  //under work
  uploadImage: async (req: Request, res: Response) => {
    try {
      if (!req) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // In production, you would upload to S3/Cloudinary/etc.
      const imagePath = `/uploads/${req.body.file.filename}`;

      return res.status(200).json({
        message: "Image uploaded successfully",
        imagePath,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

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
