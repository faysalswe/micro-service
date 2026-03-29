using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OrderService.Data;

namespace OrderService.Services;

/// <summary>
/// Service for handling idempotent requests
/// </summary>
public interface IIdempotencyService
{
    Task<IdempotencyResult> CheckAndSaveAsync(string idempotencyKey, string requestPath, string? requestBody);
    Task SaveResponseAsync(string idempotencyKey, int statusCode, object responseBody);
    Task CleanupExpiredAsync();
}

public class IdempotencyResult
{
    public bool IsDuplicate { get; set; }
    public bool IsProcessing { get; set; }
    public int? CachedStatusCode { get; set; }
    public string? CachedResponse { get; set; }
}

public class IdempotencyService : IIdempotencyService
{
    private readonly OrderDbContext _dbContext;
    private readonly ILogger<IdempotencyService> _logger;

    public IdempotencyService(OrderDbContext dbContext, ILogger<IdempotencyService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<IdempotencyResult> CheckAndSaveAsync(string idempotencyKey, string requestPath, string? requestBody)
    {
        var requestHash = ComputeHash(requestBody);

        // 1. Check if this idempotency key already exists
        var existing = await _dbContext.IdempotencyRecords
            .FirstOrDefaultAsync(i => i.IdempotencyKey == idempotencyKey);

        if (existing != null)
        {
            // Validate that the request is the same
            if (existing.RequestPath != requestPath || existing.RequestHash != requestHash)
            {
                _logger.LogWarning(
                    "Idempotency key reused with different request: {Key}, Original: {Original}, New: {New}",
                    idempotencyKey, existing.RequestPath, requestPath);

                throw new InvalidOperationException(
                    "Idempotency key was already used with a different request");
            }

            // Check if it's still processing (ResponseStatusCode == 0)
            // Allow retry if it's older than 5 minutes (stuck request)
            if (existing.ResponseStatusCode == 0 && existing.CreatedAt > DateTime.UtcNow.AddMinutes(-5))
            {
                _logger.LogInformation("Request already in progress for key: {Key}", idempotencyKey);
                return new IdempotencyResult { IsDuplicate = true, IsProcessing = true };
            }

            _logger.LogInformation("Duplicate request detected: {Key}", idempotencyKey);

            return new IdempotencyResult
            {
                IsDuplicate = true,
                IsProcessing = false,
                CachedStatusCode = existing.ResponseStatusCode,
                CachedResponse = existing.ResponseBody
            };
        }

        // 2. Try to insert a new "In-Progress" record
        try
        {
            var record = new IdempotencyRecord
            {
                IdempotencyKey = idempotencyKey,
                RequestPath = requestPath,
                RequestHash = requestHash,
                ResponseStatusCode = 0, // 0 means "In-Progress"
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };

            _dbContext.IdempotencyRecords.Add(record);
            await _dbContext.SaveChangesAsync();

            return new IdempotencyResult { IsDuplicate = false };
        }
        catch (DbUpdateException)
        {
            // Race condition: another thread inserted it between our check and save
            _logger.LogWarning("Race condition hit for idempotency key: {Key}. Re-fetching.", idempotencyKey);
            
            var reFetched = await _dbContext.IdempotencyRecords
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.IdempotencyKey == idempotencyKey);
            
            if (reFetched == null) throw; 

            return new IdempotencyResult
            {
                IsDuplicate = true,
                IsProcessing = reFetched.ResponseStatusCode == 0,
                CachedStatusCode = reFetched.ResponseStatusCode,
                CachedResponse = reFetched.ResponseBody
            };
        }
    }

    public async Task SaveResponseAsync(string idempotencyKey, int statusCode, object responseBody)
    {
        var record = await _dbContext.IdempotencyRecords
            .FirstOrDefaultAsync(i => i.IdempotencyKey == idempotencyKey);

        if (record != null)
        {
            record.ResponseStatusCode = statusCode;
            record.ResponseBody = JsonSerializer.Serialize(responseBody);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Response cached for idempotency key: {Key}", idempotencyKey);
        }
    }

    public async Task CleanupExpiredAsync()
    {
        var expired = await _dbContext.IdempotencyRecords
            .Where(i => i.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        if (expired.Any())
        {
            _dbContext.IdempotencyRecords.RemoveRange(expired);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Cleaned up {Count} expired idempotency records", expired.Count);
        }
    }

    private static string? ComputeHash(string? input)
    {
        if (string.IsNullOrEmpty(input))
            return null;

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }
}
