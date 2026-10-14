using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TourIraq.Api.DTOs;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/rewards")]
[Authorize(Roles = "Tourist")]
public class RewardsController(RewardService rewards) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<RewardDto>>> GetAll(CancellationToken ct) =>
        Ok(await rewards.GetRewardsAsync(User.GetUserId()!.Value, ct));
}
