using HotelOS.Identity.Core.Entities;
using HotelOS.Identity.Core.Enums;
using HotelOS.Identity.Core.Interfaces;

namespace HotelOS.Identity.Core.Services;

public class IdentityService : IIdentityService
{
    private readonly IAccountRepository _accountRepo;
    private readonly IStaffProfileRepository _profileRepo;

    public IdentityService(
        IAccountRepository accountRepo,
        IStaffProfileRepository profileRepo)
    {
        _accountRepo = accountRepo;
        _profileRepo = profileRepo;
    }

    public async Task<Account> LoginAsync(string email, string password)
    {
        var account = await _accountRepo.GetByEmailAsync(email)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (account.Status == AccStatus.Deleted)
            throw new UnauthorizedAccessException("Account is archived. Contact Manager to activate your account.");

        if (account.Status == AccStatus.Suspended)
            throw new UnauthorizedAccessException("Account is suspended. Contact Manager to activate your account.");

        if (!BCrypt.Net.BCrypt.Verify(password, account.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        account.LastLoginAt = DateTime.UtcNow;
        await _accountRepo.UpdateAsync(account);

        return account;
    }

    public async Task<Account> CreateClientAsync(
        string email, string password,
        string firstName, string lastName, string phone)
    {
        if (await _accountRepo.ExistsAsync(email))
            throw new InvalidOperationException(
                "An account with this email already exists.");

        var client = new Client
        {
            Id           = Guid.NewGuid(),
            Email        = email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role         = AccType.Client,
            Status       = AccStatus.Active,
            CreatedAt    = DateTime.UtcNow,
            FirstName    = firstName,
            LastName     = lastName,
            Phone        = phone
        };

        await _accountRepo.AddAsync(client);
        return client;
    }

    public async Task<Account> CreateStaffAsync(
        string email, string password,
        AccType role, StaffProfile profile)
    {
        if (await _accountRepo.ExistsAsync(email))
            throw new InvalidOperationException(
                "An account with this email already exists.");

        Account staff = role switch
        {
            AccType.Receptionist     => new Receptionist(),
            AccType.Manager          => new Manager(),
            AccType.CleaningStaff    => new CleaningStaff(),
            AccType.MaintenanceStaff => new MaintenanceStaff(),
            AccType.KitchenStaff     => new KitchenStaff(),
            AccType.Server           => new Entities.Server(),
            _ => throw new ArgumentException($"Invalid staff role: {role}")
        };

        staff.Id           = Guid.NewGuid();
        staff.Email        = email.ToLowerInvariant();
        staff.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        staff.Role         = role;
        staff.Status       = AccStatus.Active;
        staff.CreatedAt    = DateTime.UtcNow;

        await _accountRepo.AddAsync(staff);

        profile.Id        = Guid.NewGuid();
        profile.AccountId = staff.Id;
        profile.UpdatedAt = DateTime.UtcNow;

        await _profileRepo.AddAsync(profile);
        return staff;
    }

    public async Task<bool> ChangePasswordAsync(
        Guid accountId, string currentPassword, string newPassword)
    {
        var account = await _accountRepo.GetByIdAsync(accountId)
            ?? throw new KeyNotFoundException("Account not found.");

        if (!BCrypt.Net.BCrypt.Verify(currentPassword, account.PasswordHash))
            return false;

        account.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _accountRepo.UpdateAsync(account);
        return true;
    }

    public async Task<bool> DeactivateAccountAsync(Guid accountId)
    {
        var account = await _accountRepo.GetByIdAsync(accountId)
            ?? throw new KeyNotFoundException("Account not found.");

        account.Status = AccStatus.Deleted;
        await _accountRepo.UpdateAsync(account);
        return true;
    }

    public async Task<string> SuspendAccountAsync(Guid accountId)
    {
        var account = await _accountRepo.GetByIdAsync(accountId)
            ?? throw new KeyNotFoundException("Account not found.");

        account.Status = account.Status == AccStatus.Suspended
            ? AccStatus.Active
            : AccStatus.Suspended;

        await _accountRepo.UpdateAsync(account);
        return account.Status.ToString();
    }

    public async Task<Account?> GetAccountByIdAsync(Guid id)
        => await _accountRepo.GetByIdAsync(id);

    public async Task<IEnumerable<Account>> GetAllAccountsAsync()
        => await _accountRepo.GetAllAsync();

    public async Task<StaffProfile?> GetStaffProfileAsync(Guid accountId)
        => await _profileRepo.GetByAccountIdAsync(accountId);

    public async Task UpdateStaffProfileAsync(Guid accountId, StaffProfile updated)
    {
        var profile = await _profileRepo.GetByAccountIdAsync(accountId)
            ?? throw new KeyNotFoundException("Staff profile not found.");

        profile.FirstName             = updated.FirstName;
        profile.LastName              = updated.LastName;
        profile.Phone                 = updated.Phone;
        profile.Address               = updated.Address;
        profile.EmergencyContactName  = updated.EmergencyContactName;
        profile.EmergencyContactPhone = updated.EmergencyContactPhone;
        profile.Department            = updated.Department;
        profile.JobTitle              = updated.JobTitle;
        profile.HireDate              = updated.HireDate;
        profile.UpdatedAt             = DateTime.UtcNow;

        await _profileRepo.UpdateAsync(profile);
    }
}