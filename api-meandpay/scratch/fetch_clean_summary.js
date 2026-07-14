async function main() {
    console.log("--- API Summary ---");
    try {
        const res = await fetch('http://localhost:4000/api/users?limit=100000');
        const data = await res.json();
        console.log("API total from meta:", data.meta ? data.meta.total : "No meta");
        console.log("API actual data length:", data.data ? data.data.length : "No data");
        
        if (data.data) {
            // Find "endi", "anisha", "rahayu"
            const endiMatches = data.data.filter(u => u.name && u.name.toLowerCase().includes("endi"));
            const anishaMatches = data.data.filter(u => u.name && u.name.toLowerCase().includes("anisha"));
            const rahayuMatches = data.data.filter(u => u.name && u.name.toLowerCase().includes("rahayu"));
            
            console.log("\nEndi matches in API response:");
            endiMatches.forEach(u => console.log(`  - ID: ${u.id}, Name: ${u.name}, username: ${u.username}, lokasi_id: ${u.lokasi_id}, jabatan_id: ${u.jabatan_id}`));
            
            console.log("\nAnisha matches in API response:");
            anishaMatches.forEach(u => console.log(`  - ID: ${u.id}, Name: ${u.name}, username: ${u.username}, lokasi_id: ${u.lokasi_id}, jabatan_id: ${u.jabatan_id}`));
            
            console.log("\nRahayu matches in API response:");
            rahayuMatches.forEach(u => console.log(`  - ID: ${u.id}, Name: ${u.name}, username: ${u.username}, lokasi_id: ${u.lokasi_id}, jabatan_id: ${u.jabatan_id}`));
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}

main().catch(console.error);
