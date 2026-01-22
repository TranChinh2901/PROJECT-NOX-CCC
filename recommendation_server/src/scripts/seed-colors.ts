import 'reflect-metadata';
import { AppDataSource } from '@/config/database.config';
import { Color } from '@/modules/colors/entity/color.entity';

const commonColors = [
  { name_color: 'Đỏ', hex_code: '#FF0000' },
  { name_color: 'Xanh Dương', hex_code: '#0000FF' },
  { name_color: 'Xanh Lá', hex_code: '#00FF00' },
  { name_color: 'Đen', hex_code: '#000000' },
  { name_color: 'Trắng', hex_code: '#FFFFFF' },
  { name_color: 'Vàng', hex_code: '#FFFF00' },
  { name_color: 'Cam', hex_code: '#FFA500' },
  { name_color: 'Tím', hex_code: '#800080' },
  { name_color: 'Hồng', hex_code: '#FFC0CB' },
  { name_color: 'Nâu', hex_code: '#A52A2A' },
  { name_color: 'Xám', hex_code: '#808080' },
  { name_color: 'Be', hex_code: '#F5F5DC' },
  { name_color: 'Navy', hex_code: '#000080' },
  { name_color: 'Rêu', hex_code: '#556B2F' },
];

async function seedColors() {
  try {
    console.log('🌱 Starting color seeding...');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected');
    }

    const colorRepository = AppDataSource.getRepository(Color);

    for (const colorData of commonColors) {
      const exists = await colorRepository
        .createQueryBuilder('color')
        .where('LOWER(color.name_color) = LOWER(:name)', { name: colorData.name_color })
        .getOne();

      if (!exists) {
        const color = colorRepository.create(colorData);
        await colorRepository.save(color);
        console.log(`✅ Created color: ${colorData.name_color} (${colorData.hex_code})`);
      } else {
        console.log(`⏭️  Skipped (already exists): ${colorData.name_color}`);
      }
    }

    console.log('🎉 Color seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding colors:', error);
    process.exit(1);
  }
}

seedColors();
