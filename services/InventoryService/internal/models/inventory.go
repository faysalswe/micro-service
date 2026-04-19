package models

import (
	"time"
)

type ProductStock struct {
	ProductID string    `gorm:"primaryKey;size:255" json:"productId"`
	Name      string    `gorm:"size:255" json:"name"`
	Price     float64   `gorm:"type:decimal(10,2)" json:"price"`
	Quantity  int32     `gorm:"not null" json:"quantity"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type IdempotencyRecord struct {
	OrderID   string    `gorm:"primaryKey;size:255"`
	CreatedAt time.Time
}

type BatchItem struct {
	ProductID string
	Quantity  int32
}
