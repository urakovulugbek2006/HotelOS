using HotelOS.Identity.API.DTOs;
using HotelOS.Identity.Core.Entities;
using HotelOS.Identity.Core.Enums;
using HotelOS.Identity.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelOS.Identity.API.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly IIdentityService _identityService;

    public UserController(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    /// <summary>POST api/users/client — guest self-registration</summary>
    [HttpPost("client")]
    public async Task<IActionResult> CreateClient(
        [FromBody] CreateClientRequest request)
    {
        try
        {
            var account = await _identityService.CreateClientAsync(
                request.Email, request.Password,
                request.FirstName, request.LastName, request.Phone);

            return CreatedAtAction(nameof(GetById),
                new { id = account.Id },
                new { account.Id, account.Email, account.Role });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>POST api/users/staff — Manager only</summary>
    [HttpPost("staff")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> CreateStaff(
        [FromBody] CreateStaffRequest request)
    {
        try
        {
            var profile = new StaffProfile
            {
                FirstName             = request.Profile.FirstName,
                LastName              = request.Profile.LastName,
                Phone                 = request.Profile.Phone,
                Department            = request.Profile.Department,
                JobTitle              = request.Profile.JobTitle,
                HireDate              = request.Profile.HireDate,
                EmergencyContactName  = request.Profile.EmergencyContactName,
                EmergencyContactPhone = request.Profile.EmergencyContactPhone,
            };

            var account = await _identityService.CreateStaffAsync(
                request.Email, request.Password, request.Role, profile);

            return CreatedAtAction(nameof(GetById),
                new { id = account.Id },
                new { account.Id, account.Email, account.Role });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>GET api/users?role=Client — Manager or Receptionist; role filter is optional</summary>
    [HttpGet]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<IActionResult> GetAll([FromQuery] string? role)
    {
        var accounts = await _identityService.GetAllAccountsAsync();

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<AccType>(role, out var roleEnum))
            accounts = accounts.Where(a => a.Role == roleEnum);

        return Ok(accounts.Select(a => new
        {
            a.Id,
            a.Email,
            Role   = a.Role.ToString(),
            Status = a.Status.ToString(),
            a.CreatedAt,
            a.LastLoginAt
        }));
    }

    /// <summary>GET api/users/{id}</summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        var account = await _identityService.GetAccountByIdAsync(id);
        if (account is null) return NotFound();

        var profile = await _identityService.GetStaffProfileAsync(id);

        // For Client accounts, include name from the Client entity fields
        string? firstName = null;
        string? lastName  = null;
        if (account is HotelOS.Identity.Core.Entities.Client client)
        {
            firstName = client.FirstName;
            lastName  = client.LastName;
        }
        else if (profile is not null)
        {
            firstName = profile.FirstName;
            lastName  = profile.LastName;
        }

        return Ok(new
        {
            AccountId = id,
            account.Email,
            Role      = account.Role.ToString(),
            FirstName = firstName,
            LastName  = lastName,
            Profile   = profile
        });
    }

    /// <summary>PUT api/users/{id}/profile — update staff profile</summary>
    [HttpPut("{id:guid}/profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(
        Guid id, [FromBody] StaffProfileDto dto)
    {
        try
        {
            var profile = new HotelOS.Identity.Core.Entities.StaffProfile
            {
                FirstName             = dto.FirstName,
                LastName              = dto.LastName,
                Phone                 = dto.Phone,
                Department            = dto.Department,
                JobTitle              = dto.JobTitle,
                HireDate              = dto.HireDate,
                EmergencyContactName  = dto.EmergencyContactName,
                EmergencyContactPhone = dto.EmergencyContactPhone,
            };
            await _identityService.UpdateStaffProfileAsync(id, profile);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>POST api/users/{id}/change-password</summary>
    [HttpPost("{id:guid}/change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(
        Guid id, [FromBody] ChangePasswordRequest request)
    {
        try
        {
            var success = await _identityService.ChangePasswordAsync(
                id, request.CurrentPassword, request.NewPassword);

            return success
                ? Ok(new { message = "Password changed successfully." })
                : Conflict(new { message = "Current password is incorrect." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>PATCH api/users/{id}/suspendAction — Manager only, toggles Active ↔ Suspended</summary>
    [HttpPatch("{id:guid}/suspendAction")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> SuspendAction(Guid id)
    {
        try
        {
            var newStatus = await _identityService.SuspendAccountAsync(id);
            return Ok(new { status = newStatus });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>DELETE api/users/{id} — Manager only (permanent deactivation)</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        await _identityService.DeactivateAccountAsync(id);
        return NoContent();
    }
}