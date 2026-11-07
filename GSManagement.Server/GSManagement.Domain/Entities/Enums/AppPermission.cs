namespace GSManagement.Domain.Entities.Enums;

public enum AppPermission
{
    //User
    ViewUser, CreateUser, UpdateUser, DeleteUser,

    //Role
    ViewRole, CreateRole, UpdateRole, DeleteRole,

    // Permission
    ViewPermission, CreatePermission, UpdatePermssion, DeletePermssion,

    // Attendance
    ViewAttendance, CreateAttendance, UpdateAttendance, DeleteAttendance,

    //Leave
    ViewLeave, CreateLeave, UpdateLeave, DeleteLeave,

    //Client
    ViewClient, CreateClient, UpdateClient, DeleteClient,

    // Shift
    ViewShift, CreateShift, UpdateShift, DeleteShift,

    // Client: see every client (not only the ones assigned to you), and assign operators.
    // Stored by name, so new values go at the end.
    ViewAllClients, AssignClient,

    // Role: choose which roles a user holds (separate from viewing/editing roles).
    AssignRole,
}

