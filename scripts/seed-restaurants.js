const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const supabase = require("../lib/supabase");

const restaurantsPath = path.join(__dirname, "..", "data", "restaurants.json");

function loadRestaurants() {
  const raw = fs.readFileSync(restaurantsPath, "utf8");
  const parsed = JSON.parse(raw || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

async function seedRestaurants() {
  const restaurants = loadRestaurants();
  if (!restaurants.length) {
    console.log("No restaurants found to seed.");
    return;
  }

  const rows = restaurants.map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    data: restaurant,
  }));

  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const batch = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("restaurants")
      .upsert(batch, { onConflict: "id" });

    if (error) {
      throw error;
    }
  }

  console.log(`Seeded ${rows.length} restaurants into Supabase.`);
}

seedRestaurants().catch((error) => {
  console.error("Failed to seed restaurants:", error.message);
  process.exit(1);
});
