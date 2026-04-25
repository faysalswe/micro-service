using Grpc.Core;
using IdentityService.Data;
using Loyalty.V1;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Services;

public class LoyaltyServiceImpl : LoyaltyService.LoyaltyServiceBase
{
    private readonly IdentityDbContext _db;
    private readonly ILogger<LoyaltyServiceImpl> _logger;

    public LoyaltyServiceImpl(IdentityDbContext db, ILogger<LoyaltyServiceImpl> logger)
    {
        _db = db;
        _logger = logger;
    }

    public override async Task<GetLoyaltyBalanceResponse> GetLoyaltyBalance(GetLoyaltyBalanceRequest request, ServerCallContext context)
    {
        var userId = int.Parse(request.UserId);
        var user = await _db.Users.FindAsync(userId);
        
        return new GetLoyaltyBalanceResponse
        {
            Balance = user?.LoyaltyPoints ?? 0
        };
    }

    public override async Task<DeductLoyaltyPointsResponse> DeductLoyaltyPoints(DeductLoyaltyPointsRequest request, ServerCallContext context)
    {
        var userId = int.Parse(request.UserId);
        var user = await _db.Users.FindAsync(userId);

        if (user == null)
        {
            return new DeductLoyaltyPointsResponse { Success = false, Message = "User not found" };
        }

        if (user.LoyaltyPoints < request.Points)
        {
            return new DeductLoyaltyPointsResponse { Success = false, Message = "Insufficient loyalty points" };
        }

        user.LoyaltyPoints -= request.Points;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Deducted {Points} points from user {UserId} for order {OrderId}", request.Points, userId, request.OrderId);

        return new DeductLoyaltyPointsResponse
        {
            Success = true,
            RemainingBalance = user.LoyaltyPoints
        };
    }

    public override async Task<RefundLoyaltyPointsResponse> RefundLoyaltyPoints(RefundLoyaltyPointsRequest request, ServerCallContext context)
    {
        var userId = int.Parse(request.UserId);
        var user = await _db.Users.FindAsync(userId);

        if (user == null)
        {
            return new RefundLoyaltyPointsResponse { Success = false, Message = "User not found" };
        }

        user.LoyaltyPoints += request.Points;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Refunded {Points} points to user {UserId} for order {OrderId}", request.Points, userId, request.OrderId);

        return new RefundLoyaltyPointsResponse { Success = true };
    }

    public override async Task<AddLoyaltyPointsResponse> AddLoyaltyPoints(AddLoyaltyPointsRequest request, ServerCallContext context)
    {
        var userId = int.Parse(request.UserId);
        var user = await _db.Users.FindAsync(userId);

        if (user == null)
        {
            return new AddLoyaltyPointsResponse { Success = false };
        }

        user.LoyaltyPoints += request.Points;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Added {Points} points to user {UserId} for order {OrderId}", request.Points, userId, request.OrderId);

        return new AddLoyaltyPointsResponse
        {
            Success = true,
            NewBalance = user.LoyaltyPoints
        };
    }
}
