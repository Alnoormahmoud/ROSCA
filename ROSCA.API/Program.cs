using ROSCA.Application;
using ROSCA.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DI for services and repositories
builder.Services.AddInfrastructure("Server=db49471.public.databaseasp.net; Database=db49471; User Id=db49471; Password=Ft4?+Gz5Jr9!; Encrypt=True; TrustServerCertificate=True; MultipleActiveResultSets=True;");
builder.Services.AddApplication();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
