const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../ai-news-agent/data/news.db');
const db = new Database(dbPath);

async function verifyDeletion() {
    console.log("Starting deletion verification...");

    // 1. Insert dummy article
    try {
        const art = db.prepare(`
            INSERT INTO verified_news (title, content, category, published_at, created_at)
            VALUES ('Test Delete', 'Test Content', 'Politics', datetime('now'), datetime('now'))
        `).run();
        const id = art.lastInsertRowid;
        console.log(`Created test article ID: ${id}`);

        // 2. Add dependencies
        db.prepare('INSERT INTO breaking_news (verified_news_id, classification, breaking_headline) VALUES (?, ?, ?)').run(id, 'Breaking', 'Test Headline');
        console.log(`Added Breaking News dependency for ID: ${id}`);

        // 3. Attempt transactional deletion (mirrors articles.js logic)
        const deleteTransaction = db.transaction((articleId) => {
            db.prepare('DELETE FROM breaking_news WHERE verified_news_id = ?').run(articleId);
            db.prepare('DELETE FROM saved_articles WHERE news_id = ?').run(articleId);
            db.prepare('DELETE FROM read_history WHERE news_id = ?').run(articleId);
            return db.prepare('DELETE FROM verified_news WHERE id = ?').run(articleId);
        });

        const result = deleteTransaction(id);
        console.log(`Deletion result: ${result.changes} changes.`);

        // 4. Verify cleanup
        const breakingCount = db.prepare('SELECT COUNT(*) as count FROM breaking_news WHERE verified_news_id = ?').get(id).count;
        const articleCount = db.prepare('SELECT COUNT(*) as count FROM verified_news WHERE id = ?').get(id).count;

        if (breakingCount === 0 && articleCount === 0) {
            console.log("SUCCESS: Article and all dependencies were successfully deleted!");
        } else {
            console.log("FAILURE: Dependencies or article still exist.");
        }

    } catch (err) {
        console.error("FAILURE: Error during deletion:", err.message);
    }
}

verifyDeletion();
