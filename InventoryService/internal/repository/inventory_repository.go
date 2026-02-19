package repository

import (
	"context"
	"errors"
	"github.com/faysal/micro-service/inventory-service/internal/models"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
	"gorm.io/gorm"
)

type InventoryRepository interface {
	ReserveStock(ctx context.Context, orderID string, productID string, quantity int32) error
	ReleaseStock(ctx context.Context, orderID string, productID string, quantity int32) error
	GetStock(ctx context.Context, productID string) (int32, error)
	ListProducts(ctx context.Context) ([]models.ProductStock, error)
	CreateProduct(ctx context.Context, product models.ProductStock) error
	UpdateProduct(ctx context.Context, product models.ProductStock) error
	DeleteProduct(ctx context.Context, productID string) error
}

type postgresRepository struct {
	db     *gorm.DB
	tracer trace.Tracer
}

func NewPostgresRepository(db *gorm.DB) InventoryRepository {
	return &postgresRepository{
		db:     db,
		tracer: otel.Tracer("InventoryRepository"),
	}
}

func (r *postgresRepository) ListProducts(ctx context.Context) ([]models.ProductStock, error) {
	ctx, span := r.tracer.Start(ctx, "ListProducts")
	defer span.End()

	var products []models.ProductStock
	err := r.db.WithContext(ctx).Find(&products).Error
	return products, err
}

func (r *postgresRepository) CreateProduct(ctx context.Context, product models.ProductStock) error {
	ctx, span := r.tracer.Start(ctx, "CreateProduct")
	defer span.End()

	return r.db.WithContext(ctx).Create(&product).Error
}

func (r *postgresRepository) UpdateProduct(ctx context.Context, product models.ProductStock) error {
	ctx, span := r.tracer.Start(ctx, "UpdateProduct")
	defer span.End()

	return r.db.WithContext(ctx).Save(&product).Error
}

func (r *postgresRepository) DeleteProduct(ctx context.Context, productID string) error {
	ctx, span := r.tracer.Start(ctx, "DeleteProduct")
	defer span.End()

	return r.db.WithContext(ctx).Delete(&models.ProductStock{}, "product_id = ?", productID).Error
}

func (r *postgresRepository) ReserveStock(ctx context.Context, orderID string, productID string, quantity int32) error {
	ctx, span := r.tracer.Start(ctx, "ReserveStock")
	defer span.End()

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Check Idempotency
		var record models.IdempotencyRecord
		if err := tx.Where("order_id = ?", orderID).First(&record).Error; err == nil {
			return nil // Already processed
		}

		// 2. Lock the product row (Pessimistic Locking)
		var stock models.ProductStock
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("product_id = ?", productID).First(&stock).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("product not found")
			}
			return err
		}

		// 3. Check Availability
		if stock.Quantity < quantity {
			return errors.New("insufficient stock")
		}

		// 4. Deduct
		stock.Quantity -= quantity
		if err := tx.Save(&stock).Error; err != nil {
			return err
		}

		// 5. Record Idempotency
		return tx.Create(&models.IdempotencyRecord{OrderID: orderID}).Error
	})
}

func (r *postgresRepository) ReleaseStock(ctx context.Context, orderID string, productID string, quantity int32) error {
	ctx, span := r.tracer.Start(ctx, "ReleaseStock")
	defer span.End()

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Check if we actually have a reservation (Idempotency check for release)
		var record models.IdempotencyRecord
		if err := tx.Where("order_id = ?", orderID).First(&record).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil // Nothing to release or already released
			}
			return err
		}

		// 2. Lock and Update
		var stock models.ProductStock
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("product_id = ?", productID).First(&stock).Error; err != nil {
			return err
		}

		stock.Quantity += quantity
		if err := tx.Save(&stock).Error; err != nil {
			return err
		}

		// 3. Remove Idempotency record (so it can be re-reserved if needed, or mark as cancelled)
		return tx.Delete(&record).Error
	})
}

func (r *postgresRepository) GetStock(ctx context.Context, productID string) (int32, error) {
	ctx, span := r.tracer.Start(ctx, "GetStock")
	defer span.End()

	var stock models.ProductStock
	err := r.db.WithContext(ctx).Where("product_id = ?", productID).First(&stock).Error
	return stock.Quantity, err
}
