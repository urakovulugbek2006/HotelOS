using HotelOS.Identity.Core.Entities;
using HotelOS.Identity.Core.Enums;

namespace HotelOS.Identity.Core.Interfaces;

public interface IIdentityService
{
    Task<Account> LoginAsync(string email, string password);
    Task<Account> CreateClientAsync(string email, string password,
        string firstName, string lastName, string phone);
    Task<Account> CreateStaffAsync(string email, string password,
        AccType role, StaffProfile profile);
    Task<bool> ChangePasswordAsync(Guid accountId,
        string currentPassword, string newPassword);
    Task<bool> DeactivateAccountAsync(Guid accountId);
    Task<string> SuspendAccountAsync(Guid accountId);
    Task<Account?> GetAccountByIdAsync(Guid id);
    Task<IEnumerable<Account>> GetAllAccountsAsync();
    Task<StaffProfile?> GetStaffProfileAsync(Guid accountId);
    Task UpdateStaffProfileAsync(Guid accountId, StaffProfile profile);
}