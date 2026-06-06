import { ConnectRouter, HandlerContext } from "@connectrpc/connect";
import { Health } from "../../generated/grpc/health/v1/health_connect.js";
import { HealthCheckRequest, HealthCheckResponse, HealthCheckResponse_ServingStatus } from "../../generated/grpc/health/v1/health_pb.js";
import { getStatus, onStatusChange, offStatusChange } from "../../health-status.js";

export const createHealthHandler = () => {
  return (router: ConnectRouter) => {
    router.service(Health, {
      check(req: HealthCheckRequest): HealthCheckResponse {
        return new HealthCheckResponse({ status: getStatus(req.service) });
      },

      async *watch(req: HealthCheckRequest, ctx: HandlerContext) {
        yield new HealthCheckResponse({ status: getStatus(req.service) });

        const queue: HealthCheckResponse_ServingStatus[] = [];
        let notify: (() => void) | null = null;

        const listener = (service: string, status: HealthCheckResponse_ServingStatus) => {
          if (service === req.service || service === '') {
            queue.push(status);
            notify?.();
            notify = null;
          }
        };

        onStatusChange(listener);

        try {
          while (!ctx.signal.aborted) {
            if (queue.length > 0) {
              yield new HealthCheckResponse({ status: queue.shift()! });
            } else {
              await new Promise<void>((resolve) => { notify = resolve; });
            }
          }
        } finally {
          offStatusChange(listener);
        }
      },
    });
  };
};
