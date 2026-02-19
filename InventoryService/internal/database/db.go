package database

import (
	"fmt"
	"github.com/faysal/micro-service/inventory-service/internal/models"
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

	// Seed initial data if empty
	var count int64
	db.Model(&models.ProductStock{}).Count(&count)
	if count == 0 {
		db.Create(&models.ProductStock{ProductID: "PROD-001", Quantity: 100})
		db.Create(&models.ProductStock{ProductID: "PROD-002", Quantity: 50})
	}

	return db
}
