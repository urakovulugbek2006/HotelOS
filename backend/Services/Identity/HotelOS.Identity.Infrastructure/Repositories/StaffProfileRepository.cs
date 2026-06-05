using HotelOS.Identity.Core.Entities;
using HotelOS.Identity.Core.Interfaces;
using HotelOS.Identity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Identity.Infrastructure.Repositories;

public class StaffProfileRepository : IStaffProfileRepository
{
    private readonly IdentityDbContext _db;

    public StaffProfileRepository(IdentityDbContext db)
    {
        _db = db;
    }

    public async Task<StaffProfile?> GetByAccountIdAsync(Guid accountId)
        => await _db.StaffProfiles
            .Include(p => p.Address)
            .FirstOrDefaultAsync(p => p.AccountId == accountId);

    public async Task<StaffProfile?> GetByIdAsync(Guid id)
        => await _db.StaffProfiles
            .Include(p => p.Address)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task AddAsync(StaffProfile profile)
    {
        await _db.StaffProfiles.AddAsync(profile);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(StaffProfile profile)
    {
        _db.StaffProfiles.Update(profile);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var profile = await GetByIdAsync(id);
        if (profile is not null)
        {
            _db.StaffProfiles.Remove(profile);
            await _db.SaveChangesAsync();
        }
    }
}