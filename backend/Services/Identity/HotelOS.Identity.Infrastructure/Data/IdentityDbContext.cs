using HotelOS.Identity.Core.Entities;
using HotelOS.Identity.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Identity.Infrastructure.Data;

public class IdentityDbContext : DbContext
{
    public IdentityDbContext(DbContextOptions<IdentityDbContext> options)
        : base(options) { }

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Receptionist> Receptionists => Set<Receptionist>();
    public DbSet<Manager> Managers => Set<Manager>();
    public DbSet<CleaningStaff> CleaningStaff => Set<CleaningStaff>();
    public DbSet<MaintenanceStaff> MaintenanceStaff => Set<MaintenanceStaff>();
    public DbSet<KitchenStaff> KitchenStaff => Set<KitchenStaff>();
    public DbSet<Core.Entities.Server> Servers => Set<Core.Entities.Server>();
    public DbSet<StaffProfile> StaffProfiles => Set<StaffProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── TPH (Table Per Hierarchy) — all accounts in one table ─────
        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("accounts");
            entity.HasKey(a => a.Id);

            entity.Property(a => a.Id)
                  .HasColumnName("id");
            entity.Property(a => a.Email)
                  .HasColumnName("email")
                  .HasMaxLength(256)
                  .IsRequired();
            entity.Property(a => a.PasswordHash)
                  .HasColumnName("password_hash")
                  .IsRequired();
            entity.Property(a => a.Status)
                  .HasColumnName("status")
                  .HasConversion<string>()
                  .HasMaxLength(32);
            entity.Property(a => a.Role)
                  .HasColumnName("role")
                  .HasConversion<string>()
                  .HasMaxLength(32);
            entity.Property(a => a.CreatedAt)
                  .HasColumnName("created_at");
            entity.Property(a => a.LastLoginAt)
                  .HasColumnName("last_login_at");

            entity.HasIndex(a => a.Email).IsUnique();

            // discriminator column — EF uses this to know which subclass to load
            entity.HasDiscriminator<string>("role")
                  .HasValue<Client>(AccType.Client.ToString())
                  .HasValue<Receptionist>(AccType.Receptionist.ToString())
                  .HasValue<Manager>(AccType.Manager.ToString())
                  .HasValue<CleaningStaff>(AccType.CleaningStaff.ToString())
                  .HasValue<MaintenanceStaff>(AccType.MaintenanceStaff.ToString())
                  .HasValue<KitchenStaff>(AccType.KitchenStaff.ToString())
                  .HasValue<Core.Entities.Server>(AccType.Server.ToString());
        });

        // ── Client — inline personal fields + owned Address ───────────
        modelBuilder.Entity<Client>(entity =>
        {
            entity.Property(c => c.FirstName)
                  .HasColumnName("first_name")
                  .HasMaxLength(100);
            entity.Property(c => c.LastName)
                  .HasColumnName("last_name")
                  .HasMaxLength(100);
            entity.Property(c => c.Phone)
                  .HasColumnName("phone")
                  .HasMaxLength(32);
            entity.Property(c => c.LoyaltyPoints)
                  .HasColumnName("loyalty_points")
                  .HasDefaultValue(0);
            entity.Property(c => c.PreferredPaymentMethod)
                  .HasColumnName("preferred_payment_method")
                  .HasMaxLength(64);

            entity.OwnsOne(c => c.Address, address =>
            {
                address.Property(a => a.StreetAddress)
                       .HasColumnName("street_address").HasMaxLength(256);
                address.Property(a => a.City)
                       .HasColumnName("city").HasMaxLength(100);
                address.Property(a => a.State)
                       .HasColumnName("state").HasMaxLength(100);
                address.Property(a => a.ZipCode)
                       .HasColumnName("zip_code").HasMaxLength(20);
                address.Property(a => a.Country)
                       .HasColumnName("country").HasMaxLength(100);
            });
        });

        // ── Staff subclasses — only staffId + shift/zone etc ──────────
        modelBuilder.Entity<Receptionist>(entity =>
        {
            entity.Property(r => r.StaffId)
                  .HasColumnName("staff_id").HasMaxLength(64);
            entity.Property(r => r.Shift)
                  .HasColumnName("shift").HasMaxLength(32);
            entity.Property(r => r.DeskNumber)
                  .HasColumnName("desk_number").HasMaxLength(16);
            entity.Property(r => r.ProfileId)
                  .HasColumnName("profile_id");
        });

        modelBuilder.Entity<Manager>(entity =>
        {
            entity.Property(m => m.StaffId)
                  .HasColumnName("staff_id").HasMaxLength(64);
            entity.Property(m => m.Department)
                  .HasColumnName("department").HasMaxLength(100);
            entity.Property(m => m.AccessLevel)
                  .HasColumnName("access_level").HasDefaultValue(1);
            entity.Property(m => m.ProfileId)
                  .HasColumnName("profile_id");
        });

        modelBuilder.Entity<CleaningStaff>(entity =>
        {
            entity.Property(c => c.StaffId)
                  .HasColumnName("staff_id").HasMaxLength(64);
            entity.Property(c => c.CurrentAssignment)
                  .HasColumnName("current_assignment").HasMaxLength(256);
            entity.Property(c => c.ProfileId)
                  .HasColumnName("profile_id");
        });

        modelBuilder.Entity<MaintenanceStaff>(entity =>
        {
            entity.Property(m => m.StaffId)
                  .HasColumnName("staff_id").HasMaxLength(64);
            entity.Property(m => m.Specialization)
                  .HasColumnName("specialization").HasMaxLength(100);
            entity.Property(m => m.ProfileId)
                  .HasColumnName("profile_id");
        });

        modelBuilder.Entity<KitchenStaff>(entity =>
        {
            entity.Property(k => k.StaffId)
                  .HasColumnName("staff_id").HasMaxLength(64);
            entity.Property(k => k.Station)
                  .HasColumnName("station").HasMaxLength(100);
            entity.Property(k => k.ProfileId)
                  .HasColumnName("profile_id");
        });

        modelBuilder.Entity<Core.Entities.Server>(entity =>
        {
            entity.Property(s => s.StaffId)
                  .HasColumnName("staff_id").HasMaxLength(64);
            entity.Property(s => s.Zone)
                  .HasColumnName("zone").HasMaxLength(100);
            entity.Property(s => s.ProfileId)
                  .HasColumnName("profile_id");
        });

        // ── StaffProfile — separate table, linked by AccountId ─────────
        modelBuilder.Entity<StaffProfile>(entity =>
        {
            entity.ToTable("staff_profiles");
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Id)
                  .HasColumnName("id");
            entity.Property(p => p.AccountId)
                  .HasColumnName("account_id")
                  .IsRequired();
            entity.Property(p => p.FirstName)
                  .HasColumnName("first_name").HasMaxLength(100);
            entity.Property(p => p.LastName)
                  .HasColumnName("last_name").HasMaxLength(100);
            entity.Property(p => p.Phone)
                  .HasColumnName("phone").HasMaxLength(32);
            entity.Property(p => p.EmergencyContactName)
                  .HasColumnName("emergency_contact_name").HasMaxLength(100);
            entity.Property(p => p.EmergencyContactPhone)
                  .HasColumnName("emergency_contact_phone").HasMaxLength(32);
            entity.Property(p => p.Department)
                  .HasColumnName("department").HasMaxLength(100);
            entity.Property(p => p.JobTitle)
                  .HasColumnName("job_title").HasMaxLength(100);
            entity.Property(p => p.HireDate)
                  .HasColumnName("hire_date");
            entity.Property(p => p.UpdatedAt)
                  .HasColumnName("updated_at");

            entity.HasIndex(p => p.AccountId).IsUnique();

            entity.OwnsOne(p => p.Address, address =>
            {
                address.Property(a => a.StreetAddress)
                       .HasColumnName("street_address").HasMaxLength(256);
                address.Property(a => a.City)
                       .HasColumnName("city").HasMaxLength(100);
                address.Property(a => a.State)
                       .HasColumnName("state").HasMaxLength(100);
                address.Property(a => a.ZipCode)
                       .HasColumnName("zip_code").HasMaxLength(20);
                address.Property(a => a.Country)
                       .HasColumnName("country").HasMaxLength(100);
            });
        });
    }
}