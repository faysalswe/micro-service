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

	return db
}
