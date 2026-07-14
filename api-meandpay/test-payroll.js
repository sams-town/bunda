import PayrollService from './src/services/PayrollService.js';

async function test() {
    try {
        console.log("Starting generateAll test...");
        const result = await PayrollService.generateAll("April", "2026", "2026-04-01", "2026-04-30");
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error during generateAll:", error);
    } finally {
        process.exit();
    }
}

test();
