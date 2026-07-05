import { useState, useMemo, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Trash2, Shield, ShieldOff, Ban, CheckCircle2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import DataTable from "@/components/ui/DataTable";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { usersApi } from "@/services/apiServices";
import type { User } from "@/types";
import { cn } from "@/utils";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await usersApi.getAll();
    setUsers(data);
    setLoading(false);
  };

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    
    // Optimistic update
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    
    await usersApi.updateRole(user.id, newRole);
    toast.success(`${user.name} is now ${newRole === "admin" ? "an Admin" : "a User"}`);
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "banned" ? "active" : "banned";
    
    // Optimistic update
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
    
    await usersApi.updateStatus(user.id, newStatus);
    if (newStatus === "banned") {
      toast.error(`${user.name} has been banned.`);
    } else {
      toast.success(`${user.name} has been unbanned.`);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);

    // Optimistic update
    setUsers((prev) => prev.filter((u) => u.id !== targetId));
    
    await usersApi.delete(targetId);
    toast.success("User deleted permanently.");
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-3 overflow-hidden border border-white/5 flex-shrink-0 flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={20} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-foreground truncate max-w-[150px]">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const isAdmin = row.original.role === "admin";
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                isAdmin 
                  ? "bg-purple-500/10 text-purple-300 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]" 
                  : "bg-surface-3 text-muted-foreground border-white/10"
              )}
            >
              {isAdmin ? <Shield size={12} /> : <UserIcon size={12} />}
              {isAdmin ? "Admin" : "User"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isBanned = row.original.status === "banned";
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                isBanned 
                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                  : "bg-green-500/10 text-green-400 border-green-500/20"
              )}
            >
              {isBanned ? <Ban size={12} /> : <CheckCircle2 size={12} />}
              {isBanned ? "Banned" : "Active"}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Joined Date",
        cell: ({ row }) => {
          const dateStr = row.original.created_at;
          return (
            <span className="text-sm text-muted-foreground">
              {dateStr ? new Date(dateStr).toLocaleDateString() : "Unknown"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          const isAdmin = user.role === "admin";
          const isBanned = user.status === "banned";

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleRole(user)}
                title={isAdmin ? "Remove Admin" : "Make Admin"}
                className={cn(
                  "p-2 rounded-lg border transition",
                  isAdmin 
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20" 
                    : "bg-surface-2 border-white/10 text-muted-foreground hover:text-purple-400 hover:border-purple-500/30"
                )}
              >
                {isAdmin ? <ShieldOff size={16} /> : <Shield size={16} />}
              </button>

              <button
                onClick={() => handleToggleStatus(user)}
                title={isBanned ? "Unban User" : "Ban User"}
                className={cn(
                  "p-2 rounded-lg border transition",
                  isBanned 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" 
                    : "bg-surface-2 border-white/10 text-muted-foreground hover:text-red-400 hover:border-red-500/30"
                )}
              >
                {isBanned ? <CheckCircle2 size={16} /> : <Ban size={16} />}
              </button>

              <button
                onClick={() => setDeleteTarget(user)}
                title="Delete Permanently"
                className="p-2 bg-surface-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded-lg border border-white/10 hover:border-red-500/30 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <PageWrapper>
      <PageHeader
        title="User Management"
        description="Manage admins, ban abusive users, and view platform members."
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-2/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 px-4 py-2 bg-surface-3 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 placeholder:text-muted-foreground/60 transition"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-surface-3 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/50 cursor-pointer text-foreground appearance-none min-w-[120px]"
          >
            <option value="all">All Roles</option>
            <option value="user">Users Only</option>
            <option value="admin">Admins Only</option>
          </select>
        </div>
        
        <div className="text-sm font-medium text-muted-foreground">
          Total Users: <span className="text-foreground">{filteredUsers.length}</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-glass">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
          <DataTable columns={columns} data={filteredUsers} />
        )}
      </div>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete User "${deleteTarget?.name}"?`}
        description="This action is permanent and cannot be undone. All data related to this user will be removed."
      />
    </PageWrapper>
  );
}
