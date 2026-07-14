import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("--- Connecting to MySQL to find Apep Permana ---");
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'sa', // let's try 'alsyah07' first
        password: 'alsyah07'
    });

    const [databases] = await connection.query('SHOW DATABASES');
    console.log("Databases found on local MySQL:");
    
    for (const dbRow of databases) {
        const dbName = dbRow.Database;
        console.log(`\nChecking database: ${dbName}`);
        
        try {
            await connection.query(`USE \`${dbName}\``);
            
            // Check if 'users' table exists
            const [tables] = await connection.query(`SHOW TABLES LIKE 'users'`);
            if (tables.length > 0) {
                const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM users`);
                const count = countResult[0].count;
                console.log(`  - Has 'users' table with ${count} rows`);
                
                if (count > 0) {
                    const [apepCheck] = await connection.query(`SELECT id, name FROM users WHERE name LIKE '%Apep%'`);
                    if (apepCheck.length > 0) {
                        console.log(`  - FOUND APEP in database "${dbName}"!`);
                        console.log("    Matches:", apepCheck);
                    }
                }
            } else {
                console.log(`  - No 'users' table`);
            }
        } catch (e) {
            console.log(`  - Could not query: ${e.message}`);
        }
    }
    
    await connection.end();
}

main().catch(console.error);
