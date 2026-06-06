import { EventEmitter } from 'events';
import { HealthCheckResponse_ServingStatus } from './generated/grpc/health/v1/health_pb.js';

const statusMap = new Map<string, HealthCheckResponse_ServingStatus>([
  ['', HealthCheckResponse_ServingStatus.SERVING],
  ['payments.v1.PaymentService', HealthCheckResponse_ServingStatus.SERVING],
]);

const emitter = new EventEmitter();

export function getStatus(service: string): HealthCheckResponse_ServingStatus {
  return statusMap.get(service) ?? HealthCheckResponse_ServingStatus.SERVICE_UNKNOWN;
}

export function setStatus(service: string, status: HealthCheckResponse_ServingStatus): void {
  statusMap.set(service, status);
  emitter.emit('change', service, status);
}

export function onStatusChange(
  listener: (service: string, status: HealthCheckResponse_ServingStatus) => void
): void {
  emitter.on('change', listener);
}

export function offStatusChange(
  listener: (service: string, status: HealthCheckResponse_ServingStatus) => void
): void {
  emitter.off('change', listener);
}
