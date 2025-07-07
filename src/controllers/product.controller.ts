import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Product } from "../entities/product.entity";
import { CreateProductDto, UpdateProductDto } from "../dto/product.dto";
import { validate } from "class-validator";
import { QueryBuilder } from "typeorm";

const productRepository = AppDataSource.getRepository(Product);

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

      const product = productRepository.create(productData);
      await productRepository.save(product);

      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Sever Error" });
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
      });
      if (!product) {
        res.status(500).json({
          message: "Product not found",
        });
      }

      const updateData = new UpdateProductDto();
      Object.assign(updateData, req.body);

      const errors = await validate(updateData);
      if (errors.length > 0) {
        res.status(400).json({ errors });
      }

      Object.assign(product, updateData);
      await productRepository.save(product);

      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Sever Error" });
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
};
