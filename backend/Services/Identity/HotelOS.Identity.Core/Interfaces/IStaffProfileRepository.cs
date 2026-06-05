using HotelOS.Identity.Core.Entities;

namespace HotelOS.Identity.Core.Interfaces;

public interface IStaffProfileRepository
{
    Task<StaffProfile?> GetByAccountIdAsync(Guid accountId);
    Task<StaffProfile?> GetByIdAsync(Guid id);
    Task AddAsync(StaffProfile profile);
    Task UpdateAsync(StaffProfile profile);
    Task DeleteAsync(Guid id);
}