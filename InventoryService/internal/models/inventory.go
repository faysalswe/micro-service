package models

import (
	"time"
)

type ProductStock struct {
	ProductID string    `gorm:"primaryKey;size:255"`
	Name      string    `gorm:"size:255"`
	Price     float64   `gorm:"type:decimal(10,2)"`
	Quantity  int32     `gorm:"not null"`
	UpdatedAt time.Time
}

type IdempotencyRecord struct {
	OrderID   string    `gorm:"primaryKey;size:255"`
	CreatedAt time.Time
}
