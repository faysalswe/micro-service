package models

import (
	"time"
)

type ProductStock struct {
	ProductID string    `gorm:"primaryKey;size:255"`
	Quantity  int32     `gorm:"not null"`
	UpdatedAt time.Time
}

type IdempotencyRecord struct {
	OrderID   string    `gorm:"primaryKey;size:255"`
	CreatedAt time.Time
}
