package database

import (
	"inventory-service/internal/models"
	"log"

	"gorm.io/gorm"
)

// SeedDatabase populates the inventory with initial products if empty.
// This is physically separated but strictly type-safe logic.
func SeedDatabase(db *gorm.DB) {
	var count int64
	db.Model(&models.ProductStock{}).Count(&count)

	if count > 0 {
		return
	}

	products := []models.ProductStock{
		{
			ProductID: "PROD-001",
			Name:      "High-Performance Laptop",
			Price:     1299.99,
			Quantity:  50,
		},
		{
			ProductID: "PROD-002",
			Name:      "Wireless Noise-Cancelling Headphones",
			Price:     299.50,
			Quantity:  120,
		},
		{
			ProductID: "PROD-003",
			Name:      "Ergonomic Mechanical Keyboard",
			Price:     159.00,
			Quantity:  15, // Low stock for testing
		},
		{
			ProductID: "PROD-004",
			Name:      "4K Ultra HD Monitor",
			Price:     449.99,
			Quantity:  0, // Out of stock for testing
		},
		{
			ProductID: "PROD-005",
			Name:      "Basic USB Optical Mouse",
			Price:     12.99, // Cheap (Offer)
			Quantity:  200,
		},
		{
			ProductID: "PROD-006",
			Name:      "Professional Gaming Mouse",
			Price:     89.00,
			Quantity:  5, // Low stock (Offer)
		},
		{
			ProductID: "PROD-007",
			Name:      "Bluetooth Multi-Device Keyboard",
			Price:     45.00, // Cheap (Offer)
			Quantity:  8,  // Low stock (Offer)
		},
		{
			ProductID: "PROD-008",
			Name:      "USB-C Docking Station",
			Price:     129.99,
			Quantity:  40,
		},
	}

	if err := db.Create(&products).Error; err != nil {
		log.Printf("❌ Failed to seed inventory: %v", err)
	} else {
		log.Printf("✅ Inventory database seeded with %d products", len(products))
	}
}
