import { Badge, Button, Table } from "react-bootstrap";
import { User } from "../models/user";
import { deleteUser } from "../services/userapi";

function UserTable({ users }: { users: User[] }) {
  // Simple helper to get initial letter for Avatar
  const getInitial = (name?: string) =>
    name ? name.charAt(0).toUpperCase() : "?";

  return (
    <Table responsive hover className="align-middle mb-0">
      <thead className="table-light text-secondary text-uppercase small">
        <tr>
          <th className="ps-4">User</th>
          <th>Email</th>
          <th>Status</th>
          <th className="text-end pe-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            {/* User Profile Cell */}
            <td className="ps-4 py-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                  style={{ width: "38px", height: "38px", fontSize: "14px" }}
                >
                  {getInitial(user.userName)}
                </div>
                <div>
                  <div className="fw-semibold text-dark">{user.userName}</div>
                  <div className="text-muted small">ID: #{user.id}</div>
                </div>
              </div>
            </td>

            {/* Email Cell */}
            <td>
              <span className="text-secondary">{user.email}</span>
            </td>

            {/* Status Badge Cell */}
            <td>
              <Badge
                bg={user.isActive === false ? "secondary" : "success"}
                pill
                className="px-2 py-1"
              >
                {user.isActive === false ? "Inactive" : "Active"}
              </Badge>
            </td>

            {/* Actions Cell */}
            <td className="text-end pe-4">
              <div className="d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" size="sm" className="px-3">
                  Edit
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="px-2"
                  onClick={() => deleteUser(user.id)}
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default UserTable;
