using HotelOS.Identity.Core.Entities;
using HotelOS.Identity.Core.Interfaces;
using HotelOS.Identity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Identity.Infrastructure.Repositories;

public class AccountRepository : IAccountRepository
{
    private readonly IdentityDbContext _db;

    public AccountRepository(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<Account?> GetByIdAsync(Guid id)
        => await _db.Accounts.FirstOrDefaultAsync(a => a.Id == id);

    public async Task<Account?> GetByEmailAsync(string email)
        => await _db.Accounts
            .FirstOrDefaultAsync(a => a.Email == email.ToLowerInvariant());

    public async Task<IEnumerable<Account>> GetAllAsync()
        => await _db.Accounts.ToListAsync();

    public async Task AddAsync(Account account)
    {
        await _db.Accounts.AddAsync(account);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Account account)
    {
        _db.Accounts.Update(account);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var account = await GetByIdAsync(id);
        if (account is not null)
        {
            _db.Accounts.Remove(account);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(string email)
        => await _db.Accounts
            .AnyAsync(a => a.Email == email.ToLowerInvariant());
}