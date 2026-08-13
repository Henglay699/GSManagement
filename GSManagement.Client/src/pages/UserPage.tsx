import { Button, Card, Form, InputGroup, Spinner } from "react-bootstrap";
import UserTable from "../components/UserTable";
import { User } from "../models/user";
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import {fetchUsers} from "../services/userapi";
import axios from "axios";

function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>();

  const filteredUsers = users.filter(
    (user) =>
      user.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const allUsers = await fetchUsers();
        setUsers(allUsers);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    loadUsers();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://192.168.8.89:5174/userhub")
      .withAutomaticReconnect()
      .build();

    connection.on("UserCreated", (newUser: User) => {
      console.log("⚡ User Created:", newUser);
      setUsers((prevUsers) => [newUser, ...prevUsers]);
    });

    connection.on("UserUpdated", (updatedUser: User) => {
      console.log("⚡ User Updated:", updatedUser);
      setUsers((prevUsers) =>
        prevUsers.map((user: User) =>
          user.id === updatedUser.id ? { ...user, ...updatedUser } : user,
        ),
      );
    });

    connection.on("UserDeleted", (deletedUserId: number) => {
      console.log("⚡ User Deleted:", deletedUserId);
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== deletedUserId),
      );
    });

    connection
      .start()
      .then(() => console.log("✅ SignalR Connected Successfully."))
      .catch((err) => console.error("❌ SignalR Connection Error:", err));

    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop().then(() => console.log("SignalR Disconnected."));
      }
    };
  }, []);

  return (
    <div className="container py-5">
      <Card className="shadow-sm border-0 rounded-3">
        {/* Header Section */}
        <Card.Header className="bg-white py-3 border-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h4 className="fw-bold mb-1">User Management</h4>
            <p className="text-muted small mb-0">
              Manage system users, roles, and status
            </p>
          </div>
          <Button
            variant="primary"
            className="px-3 d-flex align-items-center gap-2"
          >
            <span>+</span> Add New User
          </Button>
        </Card.Header>

        <Card.Body className="p-0">
          {/* Search Bar */}
          <div className="p-3 border-top border-bottom bg-light">
            <InputGroup style={{ maxWidth: "350px" }}>
              <Form.Control
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>

          {/* Table / Loading / Empty States */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" role="status" />
              <div className="text-muted mt-2">Loading users...</div>
            </div>
          ) : errorMessage != null ? (
            <div className="text-center py-5 text-danger">{errorMessage}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5 text-muted">No users found.</div>
          ) : (
            <UserTable users={filteredUsers} />
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default UserPage;
