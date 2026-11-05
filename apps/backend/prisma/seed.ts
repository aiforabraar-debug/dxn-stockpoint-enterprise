/**
 * Database seed script — populates the shop with the DXN catalogue and default settings.
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

const DXN_CATALOGUE = [
  // Personal Care
  { sku: 'DXN-SOAP-GANO', name: 'Ganozhi Soap 75g', category: 'Personal Care', retail: 470, member: 390, pv: 65 },
  { sku: 'DXN-ALOE-BAR-1', name: 'Aloe Vera Bathing Bar (100g)', category: 'Personal Care', retail: 185, member: 155, pv: 35 },
  { sku: 'DXN-ALOE-BAR-3', name: 'Aloe Vera Bathing Bar (Family Pack, 3x100g)', category: 'Personal Care', retail: 490, member: 410, pv: 95 },
  { sku: 'DXN-NEEM-BAR-1', name: 'Neem Bathing Bar (100g)', category: 'Personal Care', retail: 210, member: 175, pv: 35 },
  { sku: 'DXN-NEEM-BAR-3', name: 'Neem Bathing Bar (Family Pack, 3x100g)', category: 'Personal Care', retail: 490, member: 410, pv: 95 },
  { sku: 'DXN-SHAMPOO-GANO', name: 'Ganozhi Shampoo 200ml', category: 'Personal Care', retail: 440, member: 365, pv: 65 },
  { sku: 'DXN-NEEM-FACEWASH', name: 'Neem Face Wash 100ml', category: 'Personal Care', retail: 230, member: 190, pv: 45 },
  { sku: 'DXN-PAPAYA-SCRUB', name: 'Papaya Facial Scrub 100ml', category: 'Personal Care', retail: 280, member: 235, pv: 55 },
  { sku: 'DXN-APRICOT-SCRUB', name: 'Apricot Facial Scrub 100ml', category: 'Personal Care', retail: 280, member: 235, pv: 55 },
  { sku: 'DXN-ALOE-SCRUB', name: 'Aloe Vera Facial Scrub 100ml', category: 'Personal Care', retail: 1400, member: 1165, pv: 190 },
  { sku: 'DXN-ALOE-CLEANSING-JELLY', name: 'Aloe Vera Cleansing Jelly', category: 'Personal Care', retail: 1310, member: 1090, pv: 145 },
  { sku: 'DXN-TOOTHPASTE-120', name: 'Ganozhi Toothpaste (Malaysian) 150g', category: 'Personal Care', retail: 1000, member: 835, pv: 110 },
  { sku: 'DXN-TOOTHPASTE-50', name: 'Ganozhi Toothpaste (Malaysian) 50g', category: 'Personal Care', retail: 640, member: 535, pv: 70 },
  { sku: 'DXN-TOOTHPASTE-IND-150', name: 'Ganozhi Toothpaste (Indian) 150g', category: 'Personal Care', retail: 840, member: 700, pv: 135 },
  { sku: 'DXN-TOOTHPASTE-IND-75', name: 'Ganozhi Toothpaste (Indian) 75g', category: 'Personal Care', retail: 565, member: 470, pv: 85 },
  { sku: 'DXN-TALCUM', name: 'Talcum Powder', category: 'Personal Care', retail: 1430, member: 1190, pv: 225 },
  { sku: 'DXN-SUNSCREEN-100', name: 'Sun Screen Lotion 100ml', category: 'Personal Care', retail: 295, member: 245, pv: 35 },
  { sku: 'DXN-BODY-LOTION', name: 'Aloe Vera Body Lotion', category: 'Personal Care', retail: 1530, member: 1275, pv: 180 },
  { sku: 'DXN-BODY-SCRUB-200', name: 'Body Scrub 200g', category: 'Personal Care', retail: 540, member: 450, pv: 90 },
  { sku: 'DXN-HAIR-OIL-100', name: 'Hair Oil 100ml', category: 'Personal Care', retail: 710, member: 590, pv: 135 },
  { sku: 'DXN-HAIR-PACK-20X5', name: 'Hair Pack (20g x 5)', category: 'Personal Care', retail: 290, member: 240, pv: 45 },
  // Coffee & Tea
  { sku: 'DXN-RISHI-GANO-TEA-200', name: 'Rishi Gano Tea 200g', category: 'Coffee & Tea', retail: 545, member: 455, pv: 90 },
  { sku: 'DXN-MASALA-TEA-100', name: 'Masala Tea 100g', category: 'Coffee & Tea', retail: 300, member: 250, pv: 60 },
  { sku: 'DXN-LZC-BLACK-20', name: 'Lingzhi Black Coffee (5g x 20)', category: 'Coffee & Tea', retail: 1190, member: 990, pv: 350 },
  { sku: 'DXN-LZC-3IN1-20', name: 'Lingzhi Coffee 3-in-1', category: 'Coffee & Tea', retail: 2460, member: 2050, pv: 475 },
  { sku: 'DXN-LZC-LITE-20', name: 'Lingzhi Coffee 3-in-1 Lite', category: 'Coffee & Tea', retail: 2370, member: 1975, pv: 365 },
  { sku: 'DXN-WHITE-COFFEE-20', name: 'White Coffee Zhino', category: 'Coffee & Tea', retail: 2550, member: 2125, pv: 290 },
  { sku: 'DXN-ZHI-MOCHA-20', name: 'Zhi Mocha Coffee', category: 'Coffee & Tea', retail: 1510, member: 1260, pv: 290 },
  { sku: 'DXN-EU-CAFE-20', name: 'Eu Cafe', category: 'Coffee & Tea', retail: 2140, member: 1785, pv: 300 },
  { sku: 'DXN-VITA-CAFE-20', name: 'Vita Cafe', category: 'Coffee & Tea', retail: 2460, member: 2050, pv: 345 },
  { sku: 'DXN-CORDYCEPS-COFFEE-20', name: 'Cordyceps Coffee 3-in-1', category: 'Coffee & Tea', retail: 2330, member: 1940, pv: 450 },
  { sku: 'DXN-LIONS-MANE-COFFEE-20', name: "Lion's Mane Coffee", category: 'Coffee & Tea', retail: 2840, member: 2365, pv: 390 },
  // Food & Drink
  { sku: 'DXN-COCOZHI-500', name: 'Cocozhi 500g', category: 'Food & Drink', retail: 2695, member: 2245, pv: 525 },
  { sku: 'DXN-SPIRULINA-CEREAL-500', name: 'Spirulina Cereal 500g', category: 'Food & Drink', retail: 3180, member: 2650, pv: 540 },
  { sku: 'DXN-CORDYCEPS-CEREAL-500', name: 'Cordyceps Cereal 500g', category: 'Food & Drink', retail: 4255, member: 3545, pv: 825 },
  { sku: 'DXN-LEMONZHI-500', name: 'Lemonzhi 500g', category: 'Food & Drink', retail: 895, member: 745, pv: 175 },
  { sku: 'DXN-ZHI-YOBITE-30', name: 'Zhi Yobite 30g', category: 'Food & Drink', retail: 840, member: 700, pv: 125 },
  { sku: 'DXN-LINA-YOBITE-30', name: 'Lina Yobite 30g', category: 'Food & Drink', retail: 840, member: 700, pv: 125 },
  { sku: 'DXN-APPLE-ENZYME-750', name: 'Apple Enzyme Drink 750ml', category: 'Food & Drink', retail: 4060, member: 3385, pv: 570 },
  { sku: 'DXN-APPLE-JAM-300', name: 'Apple Fermented Jam 300g', category: 'Food & Drink', retail: 1555, member: 1295, pv: 225 },
  { sku: 'DXN-LIONS-MANE-OOCHA', name: "Lion's Mane Oocha", category: 'Food & Drink', retail: 2810, member: 2340, pv: 395 },
  { sku: 'DXN-LIONS-MANE-MATCHA', name: "Lion's Mane Lemon Matcha", category: 'Food & Drink', retail: 2020, member: 1685, pv: 305 },
  { sku: 'DXN-SPIRUDLE-PLAIN', name: 'Spirudle', category: 'Food & Drink', retail: 1225, member: 1020, pv: 190 },
  { sku: 'DXN-GOJI-BERRY', name: 'Goji Berry', category: 'Food & Drink', retail: 4115, member: 3430, pv: 625 },
  { sku: 'DXN-OOCHA-NOODLES', name: 'Oocha Noodles', category: 'Food & Drink', retail: 1225, member: 1020, pv: 175 },
  { sku: 'DXN-OOCHA-NOODLES-TYF', name: 'Oocha Noodles (TYF)', category: 'Food & Drink', retail: 1915, member: 1595, pv: 235 },
  { sku: 'DXN-VEGGIE-NOODLE', name: 'Veggie Noodle', category: 'Food & Drink', retail: 1060, member: 885, pv: 170 },
  // Supplements
  { sku: 'DXN-RG-POWDER-50', name: 'RG Powder 50g', category: 'Supplements', retail: 4145, member: 3455, pv: 1070 },
  { sku: 'DXN-GL-POWDER-80', name: 'GL Powder 80g', category: 'Supplements', retail: 3060, member: 2550, pv: 770 },
  { sku: 'DXN-CORDYCEPS-POWDER-30', name: 'Cordyceps Powder 30g', category: 'Supplements', retail: 3275, member: 2730, pv: 960 },
  { sku: 'DXN-LIONS-MANE-POWDER-30', name: "Lion's Mane Powder 30g", category: 'Supplements', retail: 1680, member: 1400, pv: 390 },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create default shop
  const pinHash = await hashPassword('2468');
  const shop = await prisma.shop.upsert({
    where: { slug: 'mohammadpur-stock-point' },
    update: {
      admin_pin_hash: pinHash,
    },
    create: {
      name: 'Mohammadpur Stock Point',
      slug: 'mohammadpur-stock-point',
      currency: 'BDT',
      low_stock_threshold: 5,
      whatsapp_number: '8801939994578',
      business_phone: '01939994578',
      business_address: 'H # 1, R # 11, B # A, Chandrima Model Town, Dhaka-1207',
      receipt_footer: 'Thank you for choosing Mohammadpur Stock Point. Wealth through health.',
      admin_pin_hash: pinHash,
      allow_public_orders: true,
    },
  });

  console.log(`✓ Shop created/updated: ${shop.name} (${shop.id})`);

  // Create default admin user
  const adminPasswordHash = await hashPassword('admin123');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dxn-stockpoint.local' },
    update: {},
    create: {
      email: 'admin@dxn-stockpoint.local',
      passwordHash: adminPasswordHash,
      fullName: 'Shop Administrator',
      role: 'admin',
      shopId: shop.id,
    },
  });

  console.log(`✓ Admin user created/updated: ${adminUser.email}`);

  // Seed products idempotently with upsert
  for (const item of DXN_CATALOGUE) {
    await prisma.product.upsert({
      where: {
        shopId_sku: {
          shopId: shop.id,
          sku: item.sku,
        },
      },
      update: {
        name: item.name,
        category: item.category,
        retail_price: item.retail,
        member_price: item.member,
        pv_points: item.pv,
      },
      create: {
        shopId: shop.id,
        sku: item.sku,
        name: item.name,
        category: item.category,
        description: `${item.name} — premium DXN product.`,
        retail_price: item.retail,
        member_price: item.member,
        pv_points: item.pv,
        stock_qty: 50,
        low_stock_at: 5,
        image_url: null,
        is_active: true,
        revision: 0,
      },
    });
  }

  console.log(`✓ Seeded/verified ${DXN_CATALOGUE.length} products`);

  console.log('🎉 Seed complete!');
  console.log(`
===============================================================================
  DXN Stockpoint Enterprise — Seeded Successfully
-------------------------------------------------------------------------------
  Shop:       Mohammadpur Stock Point
  Shop ID:    ${shop.id}
  Admin PIN:  2468
  Admin User: admin@dxn-stockpoint.local / admin123
  API:        http://localhost:4000/api/v1
  Health:     http://localhost:4000/health
===============================================================================
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
