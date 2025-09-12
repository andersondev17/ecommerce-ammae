import { db } from '@/lib/db';
import {
  brands, categories, collections,
  colors,
  genders,
  insertBrandSchema,
  insertCategorySchema, insertCollectionSchema,
  insertColorSchema,
  insertGenderSchema,
  insertProductImageSchema,
  insertProductSchema,
  insertSizeSchema,
  insertVariantSchema,
  productCollections,
  productImages,
  products, productVariants,
  sizes,
  type InsertProduct,
  type InsertProductImage,
  type InsertVariant,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

type ProductRow = typeof products.$inferSelect;
type VariantRow = typeof productVariants.$inferSelect;
type RGBHex = `#${string}`;

const log = (...args: unknown[]) => console.log('[seed]', ...args);
const err = (...args: unknown[]) => console.error('[seed:error]', ...args);

// ✅ UTILITY FUNCTIONS - KEEP SIMPLE
function pick<T>(arr: T[], n: number) {
  const a = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && a.length; i++) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a.splice(idx, 1)[0]);
  }
  return out;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ✅ CATEGORY CONFIGURATIONS
const CATEGORY_CONFIGS = {
  shoes: {
    sizeType: 'numeric',
    sizeRange: ['7', '8', '9', '10', '11', '12'],
    priceRange: [320000, 800000], // 320k-800k COP
    imageFolder: 'shoes',
    imageCount: 15,
    names: [
      'Nike Air Max Runner', 'Nike Air Force Classic', 'Nike React Performance',
      'Nike Dunk Street', 'Nike Blazer Mid', 'Nike Cortez Vintage'
    ]
  },
  jeans: {
    sizeType: 'clothing',
    sizeRange: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    priceRange: [180000, 480000], //180k-480k COP
    imageFolder: 'jeans',
    imageCount: 10,
    names: [
      'Classic Straight Jeans', 'Skinny Fit Denim', 'High-Waist Bootcut',
      'Distressed Boyfriend', 'Dark Wash Slim', 'Vintage Relaxed'
    ]
  },
  blusas: {
    sizeType: 'clothing',
    sizeRange: ['XS', 'S', 'M', 'L', 'XL'],
    priceRange: [100000, 340000], // 100k-340k COP
    imageFolder: 'blusas',
    imageCount: 8,
    names: [
      'Floral Print Blouse', 'Silk Button-Up', 'Casual Cotton Top',
      'Elegant Wrap Blouse', 'Striped Long Sleeve', 'Chiffon V-Neck'
    ]
  },
  vestidos: {
    sizeType: 'clothing',
    sizeRange: ['XS', 'S', 'M', 'L', 'XL'],
    priceRange: [240000, 720000], // 240k-720k COP
    imageFolder: 'vestidos',
    imageCount: 12,
    names: [
      'Summer Midi Dress', 'Cocktail Evening Dress', 'Casual Day Dress',
      'Formal Business Dress', 'Boho Maxi Dress', 'Little Black Dress'
    ]
  },
  camisetas: {
    sizeType: 'clothing',
    sizeRange: ['S', 'M', 'L', 'XL', 'XXL'],
    priceRange: [60000, 180000], // 60k-180k COP
    imageFolder: 'tshirts',
    imageCount: 8,
    names: [
      'Basic Cotton Tee', 'Graphic Print T-Shirt', 'V-Neck Essential',
      'Polo Classic Fit', 'Long Sleeve Basic', 'Premium Cotton Crew'
    ]
  },
  hoodies: {
    sizeType: 'clothing',
    sizeRange: ['S', 'M', 'L', 'XL', 'XXL'],
    priceRange: [140000, 380000], // 140k-380k COP
    imageFolder: 'hoodies',
    imageCount: 6,
    names: [
      'Classic Pullover Hoodie', 'Zip-Up Fleece', 'Oversized Comfort Hoodie',
      'Athletic Performance Hoodie', 'Minimalist Hoodie', 'Urban Style Hoodie'
    ]
  },
  accesorios: {
    sizeType: 'onesize',
    sizeRange: ['One Size'],
    priceRange: [40000, 240000], // 40k-240k COP
    imageFolder: 'accessories',
    imageCount: 10,
    names: [
      'Leather Belt', 'Classic Watch', 'Designer Sunglasses',
      'Silk Scarf', 'Statement Necklace', 'Canvas Backpack'
    ]
  }
} as const;

async function seed() {
  try {
    log('🌱 Starting enhanced multi-category seed');

    // ✅ STEP 1: SEED FILTERS (GENDERS, COLORS, SIZES)
    log('Seeding genders...');
    const genderRows = [
      insertGenderSchema.parse({ label: 'Men', slug: 'men' }),
      insertGenderSchema.parse({ label: 'Women', slug: 'women' }),
      insertGenderSchema.parse({ label: 'Unisex', slug: 'unisex' }),
    ];
    for (const row of genderRows) {
      const exists = await db.select().from(genders).where(eq(genders.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(genders).values(row);
    }

    log('Seeding colors...');
    const colorRows = [
      { name: 'Black', slug: 'black', hexCode: '#000000' as RGBHex },
      { name: 'White', slug: 'white', hexCode: '#FFFFFF' as RGBHex },
      { name: 'Red', slug: 'red', hexCode: '#FF0000' as RGBHex },
      { name: 'Blue', slug: 'blue', hexCode: '#1E3A8A' as RGBHex },
      { name: 'Green', slug: 'green', hexCode: '#10B981' as RGBHex },
      { name: 'Gray', slug: 'gray', hexCode: '#6B7280' as RGBHex },
      { name: 'Pink', slug: 'pink', hexCode: '#EC4899' as RGBHex },
      { name: 'Navy', slug: 'navy', hexCode: '#1E40AF' as RGBHex },
    ].map((c) => insertColorSchema.parse(c));
    for (const row of colorRows) {
      const exists = await db.select().from(colors).where(eq(colors.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(colors).values(row);
    }

    // ✅ CRITICAL: UNIFIED SIZE SYSTEM
    log('Seeding unified size system...');
    const sizeRows = [
      // Shoe sizes
      { name: '7', slug: '7', sortOrder: 0 },
      { name: '8', slug: '8', sortOrder: 1 },
      { name: '9', slug: '9', sortOrder: 2 },
      { name: '10', slug: '10', sortOrder: 3 },
      { name: '11', slug: '11', sortOrder: 4 },
      { name: '12', slug: '12', sortOrder: 5 },
      // Clothing sizes
      { name: 'XS', slug: 'xs', sortOrder: 10 },
      { name: 'S', slug: 's', sortOrder: 11 },
      { name: 'M', slug: 'm', sortOrder: 12 },
      { name: 'L', slug: 'l', sortOrder: 13 },
      { name: 'XL', slug: 'xl', sortOrder: 14 },
      { name: 'XXL', slug: 'xxl', sortOrder: 15 },
      // One size
      { name: 'One Size', slug: 'onesize', sortOrder: 20 },
    ].map((s) => insertSizeSchema.parse(s));
    for (const row of sizeRows) {
      const exists = await db.select().from(sizes).where(eq(sizes.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(sizes).values(row);
    }

    // ✅ STEP 2: SEED BRANDS
    log('Seeding brands...');
    const brandRows = [
      { name: 'Nike', slug: 'nike', logoUrl: undefined },
      { name: 'AMMAE', slug: 'ammae', logoUrl: undefined },
      { name: 'Premium', slug: 'premium', logoUrl: undefined },
    ];
    for (const brand of brandRows) {
      const brandData = insertBrandSchema.parse(brand);
      const exists = await db.select().from(brands).where(eq(brands.slug, brandData.slug)).limit(1);
      if (!exists.length) await db.insert(brands).values(brandData);
    }

    // ✅ STEP 3: SEED CATEGORIES
    log('Seeding categories...');
    const catRows = [
      { name: 'Shoes', slug: 'shoes', parentId: null },
      { name: 'Jeans', slug: 'jeans', parentId: null },
      { name: 'Blusas', slug: 'blusas', parentId: null },
      { name: 'Vestidos', slug: 'vestidos', parentId: null },
      { name: 'Camisetas', slug: 'camisetas', parentId: null },
      { name: 'Hoodies', slug: 'hoodies', parentId: null },
      { name: 'Accesorios', slug: 'accesorios', parentId: null },
    ].map((c) => insertCategorySchema.parse(c));
    for (const row of catRows) {
      const exists = await db.select().from(categories).where(eq(categories.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(categories).values(row);
    }

    // ✅ STEP 4: SEED COLLECTIONS
    log('Seeding collections...');
    const collectionRows = [
      insertCollectionSchema.parse({ name: "Summer '25", slug: 'summer-25' }),
      insertCollectionSchema.parse({ name: 'New Arrivals', slug: 'new-arrivals' }),
      insertCollectionSchema.parse({ name: 'Classics', slug: 'classics' }),
    ];
    for (const row of collectionRows) {
      const exists = await db.select().from(collections).where(eq(collections.slug, row.slug)).limit(1);
      if (!exists.length) await db.insert(collections).values(row);
    }

    // ✅ STEP 5: GET ALL REFERENCES
    const allGenders = await db.select().from(genders);
    const allColors = await db.select().from(colors);
    const allSizes = await db.select().from(sizes);
    const allBrands = await db.select().from(brands);
    const allCategories = await db.select().from(categories);
    const allCollections = await db.select().from(collections);

    // ✅ STEP 6: CREATE UPLOAD DIRECTORIES
    const uploadsRoot = join(process.cwd(), 'static', 'uploads');
    if (!existsSync(uploadsRoot)) {
      mkdirSync(uploadsRoot, { recursive: true });
    }

    // ✅ STEP 7: SEED PRODUCTS BY CATEGORY
    log('🛍️ Creating products for all categories...');

    for (const [categorySlug, config] of Object.entries(CATEGORY_CONFIGS)) {
      const category = allCategories.find(c => c.slug === categorySlug);
      if (!category) {
        log(`⚠️ Category ${categorySlug} not found, skipping`);
        continue;
      }

      log(`Creating products for ${categorySlug}...`);

      // Create upload directory for this category
      const categoryUploadDir = join(uploadsRoot, config.imageFolder);
      if (!existsSync(categoryUploadDir)) {
        mkdirSync(categoryUploadDir, { recursive: true });
      }

      const productsToCreate = categorySlug === 'shoes' ? 8 : 6; // More shoes, fewer clothing items

      for (let i = 0; i < productsToCreate; i++) {
        const name = config.names[i % config.names.length];

        // Smart gender assignment
        const genderOptions = categorySlug === 'blusas' || categorySlug === 'vestidos'
          ? allGenders.filter(g => g.slug === 'women')
          : categorySlug === 'camisetas' || categorySlug === 'hoodies'
            ? allGenders.filter(g => g.slug !== 'women')
            : allGenders;

        const gender = genderOptions[randInt(0, genderOptions.length - 1)];

        // Brand assignment
        const brand = categorySlug === 'shoes'
          ? allBrands.find(b => b.slug === 'nike')
          : allBrands.find(b => b.slug === 'ammae');

        const desc = `Experience style and comfort with ${name}. Perfect for any occasion.`;

        const product = insertProductSchema.parse({
          name,
          description: desc,
          categoryId: category.id,
          genderId: gender?.id ?? null,
          brandId: brand?.id ?? null,
          isPublished: true,
        });

        const retP = await db.insert(products).values(product as InsertProduct).returning();
        const insertedProduct = (retP as ProductRow[])[0];

        // ✅ SIZE-AWARE VARIANT CREATION
        const availableSizes = allSizes.filter(s =>
          (config.sizeRange as readonly string[]).includes(s.name)
        );

        const colorChoices = pick(allColors, randInt(2, Math.min(4, allColors.length)));
        const sizeChoices = pick(availableSizes, randInt(2, Math.min(4, availableSizes.length)));

        const variantIds: string[] = [];
        let defaultVariantId: string | null = null;

        for (const color of colorChoices) {
          for (const size of sizeChoices) {
            const [minPrice, maxPrice] = config.priceRange;
            const priceNum = Math.round(randInt(minPrice, maxPrice) / 1000) * 1000;
            const discountedNum = Math.random() < 0.3
              ? Math.round((priceNum - randInt(20000, 50000)) / 1000) * 1000
              : null;
            const sku = `${brand?.slug?.toUpperCase() || 'AMMAE'}-${insertedProduct.id.slice(0, 6)}-${color.slug.toUpperCase()}-${size.slug.toUpperCase()}`;

            const variant = insertVariantSchema.parse({
              productId: insertedProduct.id,
              sku,
              price: priceNum.toString(),
              salePrice: discountedNum !== null ? discountedNum.toString() : undefined,
              colorId: color.id,
              sizeId: size.id,
              inStock: randInt(5, 30),
              weight: config.sizeType === 'onesize' ? 0.2 : Number((Math.random() * 1 + 0.3).toFixed(2)),
              dimensions: { length: 30, width: 20, height: 12 },
            });

            const retV = await db.insert(productVariants).values(variant as InsertVariant).returning();
            const created = (retV as VariantRow[])[0];
            variantIds.push(created.id);
            if (!defaultVariantId) defaultVariantId = created.id;
          }
        }

        // Set default variant
        if (defaultVariantId) {
          await db.update(products).set({ defaultVariantId }).where(eq(products.id, insertedProduct.id));
        }

        // ✅ IMAGE HANDLING - PLACEHOLDER LOGIC
        const imageIndex = (i % config.imageCount) + 1;
        const imageName = `${config.imageFolder}-${imageIndex}.jpg`;
        const destName = `${insertedProduct.id}-${imageName}`;

        // Since we don't have actual images, create placeholder path
        const img: InsertProductImage = insertProductImageSchema.parse({
          productId: insertedProduct.id,
          url: `/static/uploads/${config.imageFolder}/${destName}`,
          sortOrder: 0,
          isPrimary: true,
        });
        await db.insert(productImages).values(img);

        // ✅ COLLECTION ASSIGNMENT
        const collectionsForProduct = Math.random() < 0.3
          ? [allCollections[randInt(0, allCollections.length - 1)]]
          : pick(allCollections, randInt(1, 2));

        for (const col of collectionsForProduct) {
          await db.insert(productCollections).values({
            productId: insertedProduct.id,
            collectionId: col.id,
          });
        }

        log(`✅ Created ${name} with ${variantIds.length} variants`);
      }
    }

    log('🎉 Enhanced multi-category seeding complete!');
    log(`📊 Created products across ${Object.keys(CATEGORY_CONFIGS).length} categories`);

  } catch (e) {
    err('❌ Seeding failed:', e);
    process.exitCode = 1;
  }
}

seed();