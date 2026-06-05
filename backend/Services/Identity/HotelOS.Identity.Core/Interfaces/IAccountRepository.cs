using HotelOS.Identity.Core.Entities;

namespace HotelOS.Identity.Core.Interfaces;

public interface IAccountRepository
{
    Task<Account?> GetByIdAsync(Guid id);
    Task<Account?> GetByEmailAsync(string email);
    Task<IEnumerable<Account>> GetAllAsync();
    Task AddAsync(Account account);
    Task UpdateAsync(Account account);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(string email);
}