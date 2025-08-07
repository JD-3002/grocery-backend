import { AppDataSource } from "../data-source";
import { Category } from "../entities/category.entity";
import { User } from "../entities/user.entity";
import { RBACService } from "../services/rbac.service";
import bcrypt from "bcryptjs";

async function seed() {
  await AppDataSource.initialize();

  // Create basic roles
  const adminRole = await RBACService.createRole(
    "admin",
    "Administrator with full access"
  );
  const customerRole = await RBACService.createRole(
    "customer",
    "Regular customer"
  );

  // Create permissions
  const permissions = [
    // Role permissions
    { name: "create-role", resource: "role", action: "create" },
    { name: "read-role", resource: "role", action: "read" },
    { name: "update-role", resource: "role", action: "update" },
    { name: "delete-role", resource: "role", action: "delete" },

    // Permission permissions
    { name: "create-permission", resource: "permission", action: "create" },
    { name: "read-permission", resource: "permission", action: "read" },
    { name: "update-permission", resource: "permission", action: "update" },
    { name: "delete-permission", resource: "permission", action: "delete" },

    // User-Role permissions
    { name: "create-user-role", resource: "user-role", action: "create" },
    { name: "read-user-role", resource: "user-role", action: "read" },
    { name: "delete-user-role", resource: "user-role", action: "delete" },

    // Role-Permission permissions
    {
      name: "create-role-permission",
      resource: "role-permission",
      action: "create",
    },
    {
      name: "read-role-permission",
      resource: "role-permission",
      action: "read",
    },
    {
      name: "delete-role-permission",
      resource: "role-permission",
      action: "delete",
    },

    // Product permissions
    { name: "create-product", resource: "product", action: "create" },
    { name: "read-product", resource: "product", action: "read" },
    { name: "update-product", resource: "product", action: "update" },
    { name: "delete-product", resource: "product", action: "delete" },

    // Order permissions
    { name: "create-order", resource: "order", action: "create" },
    { name: "read-order", resource: "order", action: "read" },
    { name: "update-order", resource: "order", action: "update" },
    { name: "delete-order", resource: "order", action: "delete" },

    // Category permissions
    { name: "create-category", resource: "category", action: "create" },
    { name: "read-category", resource: "category", action: "read" },
    { name: "update-category", resource: "category", action: "update" },
    { name: "delete-category", resource: "category", action: "delete" },
  ];

  for (const perm of permissions) {
    await RBACService.createPermission(
      perm.name,
      perm.resource,
      perm.action,
      `Permission to ${perm.action} ${perm.resource}`
    );
  }

  // Assign all permissions to admin role
  const allPermissions = await RBACService.getAllPermissions();
  for (const permission of allPermissions) {
    await RBACService.assignPermissionToRole(adminRole.id, permission.id);
  }

  // Assign basic permissions to customer role
  const customerPermissions = await RBACService.getAllPermissions();
  const basicCustomerPerms = customerPermissions.filter(
    (p) =>
      (p.resource === "product" && p.action === "read") ||
      (p.resource === "order" && ["create", "read"].includes(p.action))
  );

  for (const permission of basicCustomerPerms) {
    await RBACService.assignPermissionToRole(customerRole.id, permission.id);
  }

  //category creation
  const categories = [
    { name: "Fruits & Vegetables", description: "Fresh fruits and vegetables" },
    { name: "Dairy & Eggs", description: "Milk, cheese, eggs and more" },
    { name: "Meat & Seafood", description: "Fresh meat and seafood" },
    { name: "Bakery", description: "Bread, cakes and pastries" },
    { name: "Beverages", description: "Drinks and juices" },
  ];

  const categoryRepository = AppDataSource.getRepository(Category);
  for (const cat of categories) {
    await categoryRepository.save(categoryRepository.create(cat));
  }
  //addmin creation
  const userRepository = AppDataSource.getRepository(User);
  const admin = new User();
  admin.firstname = "Poojan";
  admin.lastname = "Shah";
  admin.username = "poojan23";
  admin.email = "poojan@popaya.in";
  admin.phone = "+919833729922";
  admin.userRole = "su";
  admin.setPassword("1234567");
  await userRepository.save(admin);

  // Assign admin role to admin user
  await RBACService.assignRoleToUser(admin.id, adminRole.id);

  console.log("Database seeded successfully");
  console.log("Admin user created:");
  console.log(`Email: poojan@popaya.in`);
  console.log(`Password: 1234567`);

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
