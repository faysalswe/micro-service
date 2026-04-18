import { Db } from 'mongodb';
import { logger } from '../logger';

/**
 * Static registry for default payment records.
 * Physically separated from server.ts but strictly type-safe.
 */
export async function seedDatabase(db: Db): Promise<void> {
  const collection = db.collection('payments');
  const count = await collection.countDocuments();
  
  if (count > 0) {
    return;
  }

  const seedPayments = [
    {
      orderId: "f284b868-e7c6-4318-8743-3453b3b44b20",
      userId: "admin",
      amount: 999.99,
      status: "COMPLETED",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      orderId: "d7f57c5e-8e8e-4a4a-9b9b-1c1c1c1c1c1c",
      userId: "admin",
      amount: 1199.00,
      status: "COMPLETED",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      orderId: "ORD-TEST-001",
      userId: "john_doe",
      amount: 159.00,
      status: "COMPLETED",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ];

  await collection.insertMany(seedPayments);
  logger.info(`✅ Payment database seeded with ${seedPayments.length} records`);
}
