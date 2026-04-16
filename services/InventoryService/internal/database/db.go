package database

import (
	"fmt"
	"inventory-service/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
)

func InitDB(host, user, password, dbname, port string) *gorm.DB {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, dbname, port)
	
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto Migration
	err = db.AutoMigrate(&models.ProductStock{}, &models.IdempotencyRecord{})
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	seedDatabase(db)

	return db
}

func seedDatabase(db *gorm.DB) {
	var count int64
	db.Model(&models.ProductStock{}).Count(&count)
	if count == 0 {
		products := []models.ProductStock{
			{ProductID: "prod-001", Name: "iPhone 15 Pro", Price: 999.99, Quantity: 50},
			{ProductID: "prod-002", Name: "MacBook Air M3", Price: 1199.00, Quantity: 30},
			{ProductID: "prod-003", Name: "AirPods Pro", Price: 249.00, Quantity: 100},
			{ProductID: "prod-004", Name: "Apple Watch Series 9", Price: 399.00, Quantity: 40},
		}
		for _, p := range products {
			db.Create(&p)
		}
		fmt.Println("✅ Inventory database seeded with initial products")
	}
}
