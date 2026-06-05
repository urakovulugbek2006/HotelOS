using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HotelOS.Identity.Core.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace HotelOS.Identity.API.Services;

public class JwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(Account account)
    {
        var key = _config["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT key not configured.");

        var securityKey  = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials  = new SigningCredentials(
            securityKey, SecurityAlgorithms.HmacSha256);
        var expiry       = int.Parse(_config["Jwt:ExpiryMinutes"] ?? "60");

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   account.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, account.Email),
            new Claim(ClaimTypes.Role,               account.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             _config["Jwt:Issuer"],
            audience:           _config["Jwt:Audience"],
            claims:             claims,
            expires:            DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}