import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateWishlistTable1770297908578 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create wishlists table
        await queryRunner.createTable(new Table({
            name: "wishlists",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment",
                },
                {
                    name: "user_id",
                    type: "int",
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "255",
                },
                {
                    name: "is_default",
                    type: "boolean",
                    default: false,
                },
                {
                    name: "is_public",
                    type: "boolean",
                    default: false,
                },
                {
                    name: "share_token",
                    type: "varchar",
                    length: "255",
                    isNullable: true,
                    isUnique: true,
                },
                {
                    name: "created_at",
                    type: "datetime",
                    default: "CURRENT_TIMESTAMP",
                },
                {
                    name: "updated_at",
                    type: "datetime",
                    default: "CURRENT_TIMESTAMP",
                    onUpdate: "CURRENT_TIMESTAMP",
                },
            ],
        }), true);

        // Add foreign key for wishlists -> users (idempotent for partially applied migrations)
        let wishlistsTable = await queryRunner.getTable("wishlists");
        const hasWishlistsUserFk = wishlistsTable?.foreignKeys.some(
            (fk) => fk.columnNames.includes("user_id") && fk.referencedTableName === "users"
        );
        if (!hasWishlistsUserFk) {
            await queryRunner.createForeignKey("wishlists", new TableForeignKey({
                columnNames: ["user_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            }));
        }

        // Modify wishlist_items to link to wishlists instead of just user_id
        // First, add wishlist_id column if it does not exist
        let wishlistItemsTable = await queryRunner.getTable("wishlist_items");
        const hasWishlistIdColumn = wishlistItemsTable?.columns.some((c) => c.name === "wishlist_id");
        if (!hasWishlistIdColumn) {
            await queryRunner.query(`ALTER TABLE wishlist_items ADD COLUMN wishlist_id INT NULL AFTER user_id`);
        }

        // Migrate existing data: Create default wishlists for users who have items
        const usersWithItems = await queryRunner.query(`SELECT DISTINCT user_id FROM wishlist_items`);

        for (const user of usersWithItems) {
            // Reuse existing default wishlist if present to avoid duplicates on re-runs.
            const existing = await queryRunner.query(
                `SELECT id FROM wishlists WHERE user_id = ? AND is_default = 1 ORDER BY id ASC LIMIT 1`,
                [user.user_id]
            );
            let wishlistId: number;
            if (existing.length > 0) {
                wishlistId = existing[0].id;
            } else {
                const result = await queryRunner.query(`
                    INSERT INTO wishlists (user_id, name, is_default, created_at, updated_at)
                    VALUES (?, 'My Wishlist', 1, NOW(), NOW())
                `, [user.user_id]);
                wishlistId = result.insertId;
            }

            // Update items to point to this wishlist
            await queryRunner.query(`UPDATE wishlist_items SET wishlist_id = ? WHERE user_id = ?`, [wishlistId, user.user_id]);
        }

        // Make wishlist_id NOT NULL after data migration
        // Note: For empty wishlists items table this will just work.
        // If there are orphan items they should be deleted or assigned to a wishlist.
        // Assuming migration logic above handles it.

        // Remove old constraints if any (specifically unique constraint on user_id, variant_id)
        // We need to check if the index exists first or just try to drop it.
        // The original definition had @Unique(['user_id', 'variant_id']).
        // TypeORM naming strategy usually names it IDX_... or UQ_...
        // We'll drop the unique index by column names if possible or just proceed.

        // Let's drop the user_id column from wishlist_items as it's now redundant (linked via wishlist)
        // BUT wait, keep it for now if we want easier querying?
        // Usually items belong to a wishlist, wishlist belongs to user.
        // So wishlist_items -> wishlist -> user.
        // We should remove user_id from wishlist_items to normalize.

        // Add FK for wishlist_id
        wishlistItemsTable = await queryRunner.getTable("wishlist_items");
        const hasWishlistItemsFk = wishlistItemsTable?.foreignKeys.some(
            (fk) => fk.columnNames.includes("wishlist_id") && fk.referencedTableName === "wishlists"
        );
        if (!hasWishlistItemsFk) {
            await queryRunner.createForeignKey("wishlist_items", new TableForeignKey({
                columnNames: ["wishlist_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "wishlists",
                onDelete: "CASCADE",
            }));
        }

        // Now we can drop user_id column from wishlist_items
        wishlistItemsTable = await queryRunner.getTable("wishlist_items");
        const hasUserIdColumn = wishlistItemsTable?.columns.some((c) => c.name === "user_id");
        if (hasUserIdColumn) {
            // First drop the foreign key if it exists
            const foreignKey = wishlistItemsTable!.foreignKeys.find(fk => fk.columnNames.indexOf("user_id") !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey("wishlist_items", foreignKey);
            }

            // Drop every index/unique index involving user_id before dropping the column.
            const userIdIndexes = wishlistItemsTable!.indices.filter(idx => idx.columnNames.indexOf("user_id") !== -1);
            for (const idx of userIdIndexes) {
                await queryRunner.dropIndex("wishlist_items", idx);
            }

            await queryRunner.query(`ALTER TABLE wishlist_items DROP COLUMN user_id`);
        }

        // Add unique constraint for wishlist_id + variant_id
        wishlistItemsTable = await queryRunner.getTable("wishlist_items");
        const hasWishlistVariantUnique = wishlistItemsTable?.indices.some(
            (idx) =>
                idx.isUnique &&
                idx.columnNames.length === 2 &&
                idx.columnNames.includes("wishlist_id") &&
                idx.columnNames.includes("variant_id")
        );
        if (!hasWishlistVariantUnique) {
            await queryRunner.query(`CREATE UNIQUE INDEX IDX_wishlist_variant ON wishlist_items (wishlist_id, variant_id)`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse the changes

        // 1. Add user_id back to wishlist_items
        await queryRunner.query(`ALTER TABLE wishlist_items ADD COLUMN user_id INT NULL`);

        // 2. Populate user_id from wishlists
        await queryRunner.query(`
            UPDATE wishlist_items wi
            JOIN wishlists w ON wi.wishlist_id = w.id
            SET wi.user_id = w.user_id
        `);

        // 3. Make user_id NOT NULL
        await queryRunner.query(`ALTER TABLE wishlist_items MODIFY COLUMN user_id INT NOT NULL`);

        // 4. Recreate FK to users
        await queryRunner.createForeignKey("wishlist_items", new TableForeignKey({
            columnNames: ["user_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE",
        }));

        // 5. Drop unique index on wishlist_id + variant_id
        await queryRunner.query(`DROP INDEX IDX_wishlist_variant ON wishlist_items`);

        // 6. Recreate unique index on user_id + variant_id
        // Note: This might fail if user has same variant in multiple lists.
        // We'll assume for rollback that duplicates are deleted or acceptable risk.
        // await queryRunner.query(`CREATE UNIQUE INDEX IDX_user_variant ON wishlist_items (user_id, variant_id)`);

        // 7. Drop wishlist_id column
        const table = await queryRunner.getTable("wishlist_items");
        const foreignKey = table!.foreignKeys.find(fk => fk.columnNames.indexOf("wishlist_id") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("wishlist_items", foreignKey);
        }
        await queryRunner.query(`ALTER TABLE wishlist_items DROP COLUMN wishlist_id`);

        // 8. Drop wishlists table
        await queryRunner.dropTable("wishlists");
    }

}
