import { ConnectRouter } from "@connectrpc/connect";
import { PaymentService } from "../../generated/payments/v1/payments_connect";
import { 
  ProcessPaymentRequest, 
  ProcessPaymentResponse, 
  RefundPaymentRequest, 
  RefundPaymentResponse 
} from "../../generated/payments/v1/payments_pb";
import { logger } from "../../logger";
import { Db } from "mongodb";
import CircuitBreaker from "opossum";

export const createPaymentHandler = (db: Db, dbBreaker: CircuitBreaker, updateBreaker: CircuitBreaker) => {
  return (router: ConnectRouter) => {
    router.service(PaymentService, {
      async processPayment(req: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
        const { orderId, amount, userId } = req;
        logger.info('Processing payment', { orderId, amount, userId });

        try {
          const success = amount < 1000;
          const paymentRecord = {
            orderId,
            userId,
            amount,
            status: success ? 'COMPLETED' : 'DECLINED',
            created_at: new Date()
          };

          const result = await dbBreaker.fire(paymentRecord) as any;

          return new ProcessPaymentResponse({
            paymentId: result.insertedId.toString(),
            success: success,
            statusMessage: success ? 'Payment authorized successfully.' : 'Payment declined: Amount too high.',
          });
        } catch (err: any) {
          logger.error('Error processing payment', { error: err.message, orderId });
          throw err;
        }
      },

      async refundPayment(req: RefundPaymentRequest): Promise<RefundPaymentResponse> {
        const { paymentId, reason } = req;
        logger.info('Processing refund', { paymentId, reason });

        try {
          await updateBreaker.fire({
            id: paymentId,
            update: { status: 'REFUNDED', refund_reason: reason, refunded_at: new Date() }
          });

          return new RefundPaymentResponse({
            paymentId: paymentId,
            success: true,
            statusMessage: 'Refund processed successfully.',
          });
        } catch (err: any) {
          logger.error('Refund processing failed', { error: err.message, paymentId });
          throw err;
        }
      }
    });
  };
};
