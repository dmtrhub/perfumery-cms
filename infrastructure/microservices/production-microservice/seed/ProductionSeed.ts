import { AppDataSource } from "../src/Database/InitializeConnection";
import { Plant } from "../src/Domain/models/Plant";
import { PlantStatus } from "../src/Domain/enums/PlantStatus";

async function seedPlants() {
  try {
    await AppDataSource.initialize();

    const plantRepository = AppDataSource.getRepository(Plant);

    // Check if data already exists
    const existingPlants = await plantRepository.count();
    if (existingPlants > 0) {
      console.log("✅ Plants already seeded, skipping...");
      return;
    }

    const seedPlants = [
      {
        commonName: "Rosa damascena",
        latinName: "Rosa damascena Mill.",
        originCountry: "Bulgaria",
        aromaticOilStrength: 4.5,
        status: PlantStatus.PLANTED
      },
      {
        commonName: "Jasmine sambac",
        latinName: "Jasminum sambac L.",
        originCountry: "Saudi Arabia",
        aromaticOilStrength: 4.8,
        status: PlantStatus.PLANTED
      },
      {
        commonName: "Lavender",
        latinName: "Lavandula angustifolia",
        originCountry: "France",
        aromaticOilStrength: 4.2,
        status: PlantStatus.HARVESTED
      },
      {
        commonName: "Sandalwood",
        latinName: "Santalum album",
        originCountry: "India",
        aromaticOilStrength: 4.6,
        status: PlantStatus.HARVESTED
      },
      {
        commonName: "Lemongrass",
        latinName: "Cymbopogon citratus",
        originCountry: "Thailand",
        aromaticOilStrength: 3.9,
        status: PlantStatus.PLANTED
      }
    ];

    for (const plantData of seedPlants) {
      const plant = plantRepository.create(plantData);
      await plantRepository.save(plant);
      console.log(`✅ Plant created: ${plantData.commonName}`);
    }

    console.log("✅ Production plants seeded successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedPlants()
  .then(() => {
    console.log("✅ Production seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Production seed failed:", error);
    process.exit(1);
  });
