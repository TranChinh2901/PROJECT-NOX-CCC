import 'reflect-metadata';
import { AppDataSource } from '@/config/database.config';
import { Product } from '@/modules/products/entity/product';
import { getEmbeddings } from '@/utils/chatbot/chatbot-embeddings';

const EMBEDDING_BATCH_SIZE = 10;

const buildProductEmbeddingInput = (product: Product): string => {
  const brandStr = product.brand?.name ? `Brand: ${product.brand.name}. ` : '';
  const catStr = product.category?.name ? `Category: ${product.category.name}. ` : '';
  const descStr = `Description: ${product.short_description || product.description}`.substring(0, 1000);

  return `Product: ${product.name}. ${catStr}${brandStr}${descStr}`;
};

const generateEmbeddings = async () => {
  await AppDataSource.initialize();
  console.log('Database initialized');

  const productRepository = AppDataSource.getRepository(Product);
  
  const products = await productRepository.find({
    select: ['id', 'name', 'description', 'short_description'],
    relations: ['category', 'brand'],
  });

  console.log(`Found ${products.length} total products. Checking for missing embeddings...`);

  // We must query raw or with createQueryBuilder to check if embedding is null since we set select: false
  const productsWithoutEmbeddings = await productRepository.createQueryBuilder('product')
    .leftJoinAndSelect('product.category', 'category')
    .leftJoinAndSelect('product.brand', 'brand')
    .where('product.embedding IS NULL')
    .getMany();

  console.log(`${productsWithoutEmbeddings.length} products need embeddings generated.`);

  for (let index = 0; index < productsWithoutEmbeddings.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = productsWithoutEmbeddings.slice(index, index + EMBEDDING_BATCH_SIZE);

    console.log(
      `Generating embeddings for products ${index + 1}-${index + batch.length} of ${productsWithoutEmbeddings.length}`,
    );

    try {
      const embeddings = await getEmbeddings(batch.map(buildProductEmbeddingInput));

      await Promise.all(
        batch.map(async (product, batchIndex) => {
          const embedding = embeddings[batchIndex];
          if (!embedding) {
            throw new Error(`Missing embedding vector for Product ID ${product.id}`);
          }

          await productRepository.createQueryBuilder()
            .update(Product)
            .set({ embedding })
            .where('id = :id', { id: product.id })
            .execute();

          console.log(`Saved embedding for Product ID ${product.id}`);
        }),
      );
    } catch (error) {
      console.error(
        `Failed to generate embeddings for batch starting at product ${batch[0]?.id ?? 'unknown'}:`,
        error,
      );
    }
  }

  await AppDataSource.destroy();
  console.log('Finished generating embeddings.');
};

generateEmbeddings().catch((error) => {
  console.error('Fatal error during embedding generation:', error);
  process.exit(1);
});
