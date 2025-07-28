import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/category.entity";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";
import { validate } from "class-validator";

const categoryRepository = AppDataSource.getRepository(Category);

export const CategoryController = {
  //Create Category (Admin only)
  createCategory: async (req: Request, res: Response) => {
    try {
      const categoryData = new CreateCategoryDto();
      Object.assign(categoryData, req.body);

      const errors = await validate(categoryData);
      if (errors.length > 0) {
        res.status(400).json({ errors });
      }

      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);

      res.status(201).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  //Get all Categories (public)
  getCategories: async (req: Request, res: Response) => {
    try {
      const { active } = req.query;
      const query = categoryRepository.createQueryBuilder("category");

      if (active === "true") {
        query.where("category.isActive = :isActive", { isActive: true });
      }

      query.orderBy("category.displayOrder", "ASC");

      const categories = await query.getMany();
      res.status(200).json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get Single Category with Products (Public)
  getCategoryBySlug: async (req: Request, res: Response) => {
    try {
      const category = await categoryRepository.findOne({
        where: { slug: req.params.slug },
        relations: ["products"],
      });

      if (!category) {
        res.status(404).json({ message: "Category not found" });
      }

      res.status(200).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Update Category (Admin only)
  updateCategory: async (req: Request, res: Response) => {
    try {
      const category = await categoryRepository.findOne({
        where: { id: req.params.id },
      });

      if (!category) {
        res.status(404).json({ message: "Category not found" });
      }

      const updateData = new UpdateCategoryDto();
      Object.assign(updateData, req.body);

      const errors = await validate(updateData);
      if (errors.length > 0) {
        res.status(400).json({ errors });
      }

      Object.assign(category, updateData);
      await categoryRepository.save(category);

      res.status(200).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Delete Category (Admin only)
  deleteCategory: async (req: Request, res: Response) => {
    try {
      const category = await categoryRepository.findOne({
        where: { id: req.params.id },
        relations: ["products"],
      });

      if (!category) {
        res.status(404).json({ message: "Category not found" });
      }

      if (category.products && category.products.length > 0) {
        res.status(400).json({
          message: "Cannot delete category with associated products",
        });
      }

      await categoryRepository.remove(category);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
