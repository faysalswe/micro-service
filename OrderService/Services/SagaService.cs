using System.Text.Json;
using OrderService.Data;

namespace OrderService.Services;

/// <summary>
/// Service for managing saga state and logging saga steps
/// </summary>
public interface ISagaService
{
    Task<Guid> StartSagaAsync(Guid sagaId, string sagaType, string correlationId);
    Task LogStepAsync(Guid sagaId, string step, string status, object? payload = null, string? errorMessage = null);
    Task CompleteStepAsync(Guid sagaId, string step);
    Task FailStepAsync(Guid sagaId, string step, string errorMessage);
    Task<IEnumerable<SagaLog>> GetSagaHistoryAsync(Guid sagaId);
}

public class SagaService : ISagaService
{
    private readonly OrderDbContext _dbContext;
    private readonly ILogger<SagaService> _logger;

    public SagaService(OrderDbContext dbContext, ILogger<SagaService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<Guid> StartSagaAsync(Guid sagaId, string sagaType, string correlationId)
    {
        var logEntry = new SagaLog
        {
            Id = Guid.NewGuid(),
            SagaId = sagaId,
            SagaType = sagaType,
            Step = "SagaStarted",
            Status = "Completed",
            CorrelationId = correlationId,
            CompletedAt = DateTime.UtcNow
        };

        _dbContext.SagaLogs.Add(logEntry);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Saga started: {SagaId}, Type: {SagaType}", sagaId, sagaType);

        return logEntry.Id;
    }

    public async Task LogStepAsync(Guid sagaId, string step, string status, object? payload = null, string? errorMessage = null)
    {
        var logEntry = new SagaLog
        {
            Id = Guid.NewGuid(),
            SagaId = sagaId,
            SagaType = "CreateOrder",
            Step = step,
            Status = status,
            Payload = payload != null ? JsonSerializer.Serialize(payload) : null,
            ErrorMessage = errorMessage,
            CompletedAt = status == "Completed" || status == "Failed" ? DateTime.UtcNow : null
        };

        _dbContext.SagaLogs.Add(logEntry);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Saga step logged: {SagaId}, Step: {Step}, Status: {Status}", sagaId, step, status);
    }

    public async Task CompleteStepAsync(Guid sagaId, string step)
    {
        await LogStepAsync(sagaId, step, "Completed");
    }

    public async Task FailStepAsync(Guid sagaId, string step, string errorMessage)
    {
        await LogStepAsync(sagaId, step, "Failed", null, errorMessage);
    }

    public async Task<IEnumerable<SagaLog>> GetSagaHistoryAsync(Guid sagaId)
    {
        return _dbContext.SagaLogs
            .Where(s => s.SagaId == sagaId)
            .OrderBy(s => s.CreatedAt)
            .AsEnumerable();
    }
}
