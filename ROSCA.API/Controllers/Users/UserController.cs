using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using ROSCA.Application.DTOs.Users;
using ROSCA.Application.Interfaces.Users;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;

    public UsersController(IUserService service)
    {
        _service = service;
    }


    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var users = await _service.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        if (id <= 0)
            return BadRequest("Invalid user ID");

        var user = await _service.GetByIdAsync(id);

        if (user == null)
            return NotFound("User not found");

        return Ok(user);
    }


    [HttpGet("username/{username}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return BadRequest("Username is required");

        var user = await _service.GetByUsernameAsync(username);

        if (user == null)
            return NotFound("User not found");

        return Ok(user);
    }

    // will be implemented in the future when we have financial data to return
    //[HttpGet("{id:int}/financial")]
    //[ProducesResponseType(StatusCodes.Status200OK)]
    //[ProducesResponseType(StatusCodes.Status400BadRequest)]
    //[ProducesResponseType(StatusCodes.Status404NotFound)]
    //public async Task<IActionResult> GetFinancial(int id)
    //{
    //    if (id <= 0)
    //        return BadRequest("Invalid user ID");

    //    var user = await _service.GetUserWithFinancialDataAsync(id);

    //    if (user == null)
    //        return NotFound("User not found");

    //    return Ok(user);
    //}


    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Add(UserToAddDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var id = await _service.AddAsync(dto);

        return CreatedAtAction(nameof(GetById), new { id },
            "User created successfully");
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, UserToUpdateDTO dto)
    {
        if (id <= 0)
            return BadRequest("Invalid user ID");

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var updated = await _service.UpdateAsync(id, dto);

        if (!updated)
            return NotFound("User not found");

        return Ok("User updated successfully");
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        if (id <= 0)
            return BadRequest("Invalid user ID");

        var deleted = await _service.DeleteAsync(id);

        if (!deleted)
            return NotFound("User not found");

        return Ok("User deleted successfully");
    }


    [HttpGet("exists")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Exists([FromQuery] string username, [FromQuery] string nationalId)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(nationalId))
            return BadRequest("Username and NationalId are required");

        var exists = await _service.ExistsAsync(username, nationalId);

        return Ok(new { exists });
    }

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] LoginDTO request)
    {
        if (request == null || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { message = "Username and Password are required." });
        }

        var user = await _service.LoginAsync(request.Username, request.Password);

        if (user == null)
        {
            // This will now show up as a 401 option in Swagger
            return Unauthorized(new { message = "Invalid username or password." });
        }

        return Ok(new
        {
            Id = user.Id,
            FullName = user.FullName,
            Username = user.Username,
            Level = user.Profile?.Level ?? "New Member",
            RawScore = user.Profile?.RawScore ?? 0
        });
    }
}